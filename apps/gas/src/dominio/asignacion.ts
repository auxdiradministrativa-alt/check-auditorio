import type { Asignacion, EstadoAsignacion, VigenciaQr } from '@check-auditorio/shared/sin-zod'

import type { Config, Entregador, RegistroAsignacion } from './entidades'
import { fallar } from './errores'

const HORA_MS = 3_600_000
const ms = (iso: string) => new Date(iso).getTime()

/** Los vencimientos no se escriben: se derivan del reloj al leer. */
export function estadoEfectivo(a: RegistroAsignacion, ahora: Date, cfg: Config): EstadoAsignacion {
  const t = ahora.getTime()
  if (a.estado === 'PROGRAMADA' && t > ms(a.fin)) return 'EXPIRADA'
  if (a.estado === 'RECIBIDA' && t > ms(a.fin) + cfg.horasDevolucion * HORA_MS)
    return 'DEVOLUCION_VENCIDA'
  return a.estado
}

/** El QR vale desde `inicio − N min` hasta el `fin` del evento. */
export function vigenciaQr(a: RegistroAsignacion, ahora: Date, cfg: Config): VigenciaQr {
  const t = ahora.getTime()
  if (t < ms(a.inicio) - cfg.minutosQrAntes * 60_000) return 'ANTES'
  if (t > ms(a.fin)) return 'VENCIDO'
  return 'VIGENTE'
}

export function exigirSinCruce(
  existentes: RegistroAsignacion[],
  nueva: { espacioId: string; inicio: string; fin: string },
  ahora: Date,
  cfg: Config,
) {
  if (!(ms(nueva.fin) > ms(nueva.inicio)))
    fallar('DATOS_INVALIDOS', 'La hora de fin debe ser posterior al inicio.')
  const cruce = existentes.find((a) => {
    if (a.espacioId !== nueva.espacioId) return false
    const estado = estadoEfectivo(a, ahora, cfg)
    if (estado === 'ANULADA' || estado === 'EXPIRADA') return false
    return ms(a.inicio) < ms(nueva.fin) && ms(nueva.inicio) < ms(a.fin)
  })
  if (cruce) fallar('DATOS_INVALIDOS', `Se cruza con «${cruce.evento}» en el mismo espacio.`)
}

const ANULABLES: EstadoAsignacion[] = ['PROGRAMADA', 'EN_VALIDACION', 'EN_DILIGENCIAMIENTO']

export function exigirAnulable(a: RegistroAsignacion) {
  if (!ANULABLES.includes(a.estado))
    fallar('ESTADO_INVALIDO', 'Solo se anula una asignación que aún no se ha recibido.')
}

export function exigirReceptor(a: RegistroAsignacion, sub: string) {
  if (!a.receptor || a.receptor.sub !== sub)
    fallar('NO_AUTORIZADO', 'Esta asignación está a nombre de otra cuenta.')
}

export function aVista(
  a: RegistroAsignacion,
  entregadores: Entregador[],
  ahora: Date,
  cfg: Config,
): Asignacion {
  const correo = a.entregadoPorCorreo.toLowerCase()
  return {
    id: a.id,
    espacioId: a.espacioId,
    evento: a.evento,
    inicio: a.inicio,
    fin: a.fin,
    estado: estadoEfectivo(a, ahora, cfg),
    entregadoPor: {
      correo: a.entregadoPorCorreo,
      nombre:
        entregadores.find((e) => e.correo.toLowerCase() === correo)?.nombre || a.entregadoPorCorreo,
    },
    receptor: a.receptor ? { correo: a.receptor.correo, nombre: a.receptor.nombre } : null,
    consecutivo: a.consecutivo,
    creadaEn: a.creadaEn,
  }
}
