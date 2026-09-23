import { isoBogota, type Entrada, type Salida } from '@check-auditorio/shared/sin-zod'

import { exigirAnulable, exigirSinCruce } from '../../dominio/asignacion'
import { SIN_NOTIFICACION } from '../../dominio/entidades'
import { fallar } from '../../dominio/errores'
import type { Contexto } from '../puertos'
import { exigirAsignacion, marcaDeTiempo, releer, vista } from './comun'

export function listarAsignaciones(ctx: Contexto): Salida<'asignacion.listar'> {
  return ctx.asignaciones
    .listar()
    .map((a) => vista(ctx, a))
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
}

export function obtenerAsignacion(
  ctx: Contexto,
  { id }: Entrada<'asignacion.obtener'>,
): Salida<'asignacion.obtener'> {
  const a = ctx.asignaciones.porId(id)
  return a ? vista(ctx, a) : null
}

export function crearAsignacion(
  ctx: Contexto,
  e: Entrada<'asignacion.crear'>,
): Salida<'asignacion.crear'> {
  return ctx.srv.conBloqueo(() => {
    if (!ctx.catalogo.espacios().some((s) => s.id === e.espacioId))
      fallar('DATOS_INVALIDOS', 'El espacio no existe o está inactivo.')
    const inicio = isoBogota(new Date(e.inicio))
    const fin = isoBogota(new Date(e.fin))
    exigirSinCruce(
      ctx.asignaciones.listar(),
      { espacioId: e.espacioId, inicio, fin },
      ctx.srv.ahora(),
      ctx.catalogo.config(),
    )
    const id = e.id
    if (!/^[0-9a-f-]{36}$/i.test(id) || ctx.asignaciones.porId(id))
      fallar('DATOS_INVALIDOS', 'Identificador de asignación inválido o repetido.')
    if (!/^[0-9a-f]{64}$/.test(e.tokenSha256)) fallar('DATOS_INVALIDOS', 'Huella del QR inválida.')
    ctx.asignaciones.agregar({
      id,
      espacioId: e.espacioId,
      evento: e.evento.trim(),
      inicio,
      fin,
      estado: 'PROGRAMADA',
      entregadoPorCorreo: e.entregadoPor.correo,
      creadaEn: marcaDeTiempo(ctx),
      tokenSha256: e.tokenSha256,
      tokenVence: fin,
      receptor: null,
      consecutivo: null,
      invitadoCorreo: null,
      solicitadaEn: null,
      motivoRechazo: null,
      solicitud: null,
      autorizacion: null,
      notifDecision: SIN_NOTIFICACION,
      notifConfirmacion: SIN_NOTIFICACION,
      notifVencida: SIN_NOTIFICACION,
    })
    ctx.bitacora.registrar('asignacion.crear', id, e.entregadoPor.correo, { evento: e.evento })
    return releer(ctx, id)
  })
}

export function anularAsignacion(
  ctx: Contexto,
  { id, actor }: Entrada<'asignacion.anular'>,
): Salida<'asignacion.anular'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, id)
    exigirAnulable(a)
    ctx.asignaciones.actualizar(id, { estado: 'ANULADA' })
    ctx.bitacora.registrar('asignacion.anular', id, actor.correo, { estadoPrevio: a.estado })
    return releer(ctx, id)
  })
}
