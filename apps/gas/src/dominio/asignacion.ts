import {
  isoBogota,
  type Asignacion,
  type EstadoAsignacion,
  type VigenciaQr,
} from '@check-auditorio/shared/sin-zod'

import type { Config, Entregador, RegistroAsignacion } from './entidades'
import { fallar } from './errores'

const HORA_MS = 3_600_000
const ms = (iso: string) => new Date(iso).getTime()

/** Estados del flujo por enlace que aún no ocupan la franja: vencen con `token_vence`. */
const PREVIOS_A_APROBAR: EstadoAsignacion[] = ['INVITADA', 'SOLICITADA', 'RECHAZADA']

/** Los vencimientos no se escriben: se derivan del reloj al leer. */
export function estadoEfectivo(a: RegistroAsignacion, ahora: Date, cfg: Config): EstadoAsignacion {
  const t = ahora.getTime()
  if (PREVIOS_A_APROBAR.includes(a.estado) && t > ms(a.tokenVence)) return 'EXPIRADA'
  if (a.estado === 'PROGRAMADA' && t > ms(a.fin)) return 'EXPIRADA'
  if (a.estado === 'RECIBIDA' && t > ms(a.fin) + cfg.horasDevolucion * HORA_MS)
    return 'DEVOLUCION_VENCIDA'
  return a.estado
}

/** Desde cuándo se puede recibir; la web lo muestra tal cual, sin repetir la regla. */
const recepcionDesdeMs = (a: RegistroAsignacion, cfg: Config) =>
  ms(a.inicio) - cfg.minutosQrAntes * 60_000

/** El QR vale desde `inicio − N min` hasta el `fin` del evento. */
export function vigenciaQr(a: RegistroAsignacion, ahora: Date, cfg: Config): VigenciaQr {
  const t = ahora.getTime()
  if (t < recepcionDesdeMs(a, cfg)) return 'ANTES'
  if (t > ms(a.fin)) return 'VENCIDO'
  return 'VIGENTE'
}

/** «14:00» de un ISO con desfase de Bogotá, sin depender de la zona del servidor. */
const horaCorta = (iso: string) => iso.slice(11, 16)

/**
 * Solo ocupa la franja lo aprobado o en curso: dos solicitudes pendientes pueden proponer la
 * misma hora, y gana la primera que Infraestructura apruebe (se vuelve a evaluar al aprobar).
 * El mensaje no nombra el otro evento: quien solicita no debe ver reservas ajenas.
 */
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
    if (estado === 'ANULADA' || estado === 'EXPIRADA' || PREVIOS_A_APROBAR.includes(estado))
      return false
    return ms(a.inicio) < ms(nueva.fin) && ms(nueva.inicio) < ms(a.fin)
  })
  if (cruce)
    fallar(
      'DATOS_INVALIDOS',
      `El espacio ya está reservado de ${horaCorta(cruce.inicio)} a ${horaCorta(cruce.fin)} ese día.`,
    )
}

const ANULABLES: EstadoAsignacion[] = [
  'INVITADA',
  'SOLICITADA',
  'RECHAZADA',
  'PROGRAMADA',
  'EN_VALIDACION',
  'EN_DILIGENCIAMIENTO',
]

export function exigirAnulable(a: RegistroAsignacion) {
  if (!ANULABLES.includes(a.estado))
    fallar('ESTADO_INVALIDO', 'Solo se anula una asignación que aún no se ha recibido.')
}

export function exigirReceptor(a: RegistroAsignacion, sub: string) {
  if (!a.receptor || a.receptor.sub !== sub)
    fallar('NO_AUTORIZADO', 'Esta asignación está a nombre de otra cuenta.')
}

/** El enlace personal solo lo usa la cuenta a la que se emitió. */
export function exigirInvitado(a: RegistroAsignacion, correo: string) {
  if (!a.invitadoCorreo)
    fallar('ESTADO_INVALIDO', 'Esta asignación no se gestiona con enlace personal.')
  if (a.invitadoCorreo !== correo.trim().toLowerCase())
    fallar('NO_AUTORIZADO', 'Este enlace es personal: ábrelo con la cuenta a la que fue enviado.')
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
    tokenVence: a.tokenVence,
    recepcionDesde: isoBogota(new Date(recepcionDesdeMs(a, cfg))),
    invitadoCorreo: a.invitadoCorreo,
    solicitadaEn: a.solicitadaEn,
    motivoRechazo: a.motivoRechazo,
    solicitud: a.solicitud
      ? {
          rol: a.solicitud.rol,
          dependencia: a.solicitud.dependencia,
          cargo: a.solicitud.cargo,
          celular: a.solicitud.celular,
          asistentesEstimados: a.solicitud.asistentes,
        }
      : null,
  }
}
