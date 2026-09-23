import type { Entrada, Salida } from '@check-auditorio/shared/sin-zod'

import { estadoEfectivo, vigenciaQr } from '../../dominio/asignacion'
import { fallar } from '../../dominio/errores'
import type { Contexto } from '../puertos'
import { exigirAsignacion, releer, vista } from './comun'

export function estadoQr(
  ctx: Contexto,
  { tokenSha256 }: Entrada<'qr.estado'>,
): Salida<'qr.estado'> {
  const a = ctx.asignaciones.porToken(tokenSha256)
  if (!a) return null
  return {
    asignacion: vista(ctx, a),
    vigencia: vigenciaQr(a, ctx.srv.ahora(), ctx.catalogo.config()),
  }
}

/** Un solo uso: solo PROGRAMADA y vigente pasa a EN_VALIDACION. Volver a entrar con la misma cuenta es idempotente. */
export function reclamarQr(
  ctx: Contexto,
  { tokenSha256, receptor }: Entrada<'qr.reclamar'>,
): Salida<'qr.reclamar'> {
  return ctx.srv.conBloqueo(() => {
    const a =
      ctx.asignaciones.porToken(tokenSha256) ?? fallar('QR_NO_VIGENTE', 'El código no existe.')
    // Puerta del flujo anterior: jamás sobre un enlace personal, aunque se llame directo.
    if (a.invitadoCorreo)
      fallar('NO_AUTORIZADO', 'Este enlace es personal: ábrelo con la cuenta a la que fue enviado.')
    if (
      a.receptor?.sub === receptor.sub &&
      (a.estado === 'EN_DILIGENCIAMIENTO' || a.estado === 'EN_VALIDACION') &&
      vigenciaQr(a, ctx.srv.ahora(), ctx.catalogo.config()) !== 'VIGENTE'
    )
      fallar('QR_NO_VIGENTE', 'El plazo para recibir este espacio ha finalizado.')
    if (a.receptor?.sub === receptor.sub && a.estado === 'EN_DILIGENCIAMIENTO') return vista(ctx, a)
    if (a.receptor?.sub === receptor.sub && a.estado === 'EN_VALIDACION') {
      ctx.asignaciones.actualizar(a.id, { estado: 'EN_DILIGENCIAMIENTO' })
      return releer(ctx, a.id)
    }
    const cfg = ctx.catalogo.config()
    if (estadoEfectivo(a, ctx.srv.ahora(), cfg) !== 'PROGRAMADA')
      fallar('QR_NO_VIGENTE', 'Este código ya fue usado.')
    if (vigenciaQr(a, ctx.srv.ahora(), cfg) !== 'VIGENTE')
      fallar('QR_NO_VIGENTE', 'El código no está vigente en este momento.')
    ctx.asignaciones.actualizar(a.id, {
      estado: 'EN_DILIGENCIAMIENTO',
      receptor: { nombre: receptor.nombre, correo: receptor.correo, sub: receptor.sub },
    })
    ctx.bitacora.registrar('qr.reclamar', a.id, receptor.correo)
    return releer(ctx, a.id)
  })
}

/** Infraestructura confirma que la cuenta es la persona presente; rechazar libera el QR. */
export function decidirValidacion(
  ctx: Contexto,
  { id, decision, actor }: Entrada<'validacion.decidir'>,
): Salida<'validacion.decidir'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, id)
    if (a.invitadoCorreo || a.estado !== 'EN_VALIDACION')
      fallar('ESTADO_INVALIDO', 'La asignación ya no está esperando validación.')
    ctx.asignaciones.actualizar(
      id,
      decision === 'CONFIRMAR'
        ? { estado: 'EN_DILIGENCIAMIENTO' }
        : { estado: 'PROGRAMADA', receptor: null },
    )
    ctx.bitacora.registrar(`validacion.${decision.toLowerCase()}`, id, actor.correo, {
      receptor: a.receptor?.correo,
    })
    return releer(ctx, id)
  })
}
