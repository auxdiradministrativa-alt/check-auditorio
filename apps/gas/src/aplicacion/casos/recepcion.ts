import type { Entrada, Salida, Sello } from '@check-auditorio/shared/sin-zod'

import { exigirReceptor } from '../../dominio/asignacion'
import type { RegistroRecepcion } from '../../dominio/entidades'
import { fallar } from '../../dominio/errores'
import { codigoVerificacion, construirDetalle, siguienteConsecutivo } from '../../dominio/recepcion'
import { contenidoRecepcion } from '../../dominio/sello'
import type { Contexto } from '../puertos'
import { exigirAsignacion, marcaDeTiempo } from './comun'

const FOTO_BASE64_MAX = 4_000_000

export const selloDe = (r: RegistroRecepcion): Sello => ({
  consecutivo: r.consecutivo,
  asignacionId: r.asignacionId,
  selladaEn: r.selladaEn,
  sha256: r.sha256,
  codigoVerificacion: r.codigoVerificacion,
})

export function subirFoto(
  ctx: Contexto,
  { asignacionId, actor, mime, base64 }: Entrada<'foto.subir'>,
): Salida<'foto.subir'> {
  const a = exigirAsignacion(ctx, asignacionId)
  exigirReceptor(a, actor.sub)
  if (a.estado !== 'EN_DILIGENCIAMIENTO' && a.estado !== 'RECIBIDA')
    fallar('ESTADO_INVALIDO', 'No se pueden adjuntar fotos en este momento.')
  if (!/^image\/(jpeg|png|webp)$/.test(mime))
    fallar('DATOS_INVALIDOS', 'Formato de foto no admitido.')
  if (base64.length > FOTO_BASE64_MAX) fallar('DATOS_INVALIDOS', 'La foto es demasiado grande.')
  const id = ctx.srv.guardarFoto(`${asignacionId}_${ctx.srv.uuid()}.jpg`, mime, base64)
  ctx.bitacora.registrar('foto.subir', asignacionId, actor.correo, { foto: id })
  return { id }
}

/**
 * Sella la constancia bajo bloqueo: consecutivo seguido, hora del registro y SHA-256 del
 * contenido canónico. Reenviar la misma clave de idempotencia devuelve el mismo sello.
 */
export function registrarRecepcion(
  ctx: Contexto,
  { asignacionId, receptor, datos, userAgent }: Entrada<'recepcion.registrar'>,
): Salida<'recepcion.registrar'> {
  return ctx.srv.conBloqueo(() => {
    const previa = ctx.recepciones.porClave(datos.claveIdempotencia)
    if (previa) return selloDe(previa)

    const a = exigirAsignacion(ctx, asignacionId)
    exigirReceptor(a, receptor.sub)
    if (a.estado !== 'EN_DILIGENCIAMIENTO')
      fallar('ESTADO_INVALIDO', 'La asignación no está lista para diligenciar.')

    const terminos =
      ctx.catalogo.terminosVigentes() ?? fallar('INTERNO', 'No hay términos vigentes.')
    const detalle = construirDetalle(ctx.catalogo.elementos(a.espacioId), datos.checklist)
    const consecutivo = siguienteConsecutivo(ctx.recepciones.consecutivos())

    const registro: RegistroRecepcion = {
      consecutivo,
      asignacionId: a.id,
      // Solo los tres campos que se guardan: el hash debe poder recalcularse desde la hoja.
      receptor: { nombre: receptor.nombre, correo: receptor.correo, sub: receptor.sub },
      rol: datos.rol,
      dependencia: datos.dependencia.trim(),
      cargo: (datos.cargo ?? '').trim(),
      celular: datos.celular.trim(),
      asistentes: datos.asistentesEstimados,
      terminosVersion: terminos.version,
      terminosSha256: terminos.sha256,
      selladaEn: marcaDeTiempo(ctx),
      sha256: '',
      codigoVerificacion: codigoVerificacion(ctx.srv.uuid()),
      claveIdempotencia: datos.claveIdempotencia,
      userAgent: userAgent.slice(0, 300),
    }
    registro.sha256 = ctx.srv.sha256Hex(contenidoRecepcion(registro, detalle, a))

    ctx.recepciones.agregar(registro, detalle)
    ctx.asignaciones.actualizar(a.id, {
      estado: 'RECIBIDA',
      consecutivo,
      // Queda en la bandeja; el activador solo la envía si la devolución llega a vencer.
      notifVencida: { estado: 'PENDIENTE', intentos: 0, reservaHasta: '' },
    })
    ctx.bitacora.registrar('recepcion.registrar', consecutivo, receptor.correo, { asignacionId })
    return selloDe(registro)
  })
}
