import {
  DOMINIO_INSTITUCIONAL,
  LIMITES,
  isoBogota,
  type Entrada,
  type Salida,
} from '@check-auditorio/shared/sin-zod'

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
    if (
      typeof e.evento !== 'string' ||
      e.evento.trim().length < 3 ||
      e.evento.trim().length > LIMITES.eventoMax ||
      !Number.isFinite(Date.parse(e.inicio)) ||
      !Number.isFinite(Date.parse(e.fin))
    )
      fallar('DATOS_INVALIDOS', 'Revisa el evento y las fechas de la entrega.')
    const inicio = isoBogota(new Date(e.inicio))
    const fin = isoBogota(new Date(e.fin))
    const correo = e.correoReceptor?.trim().toLowerCase() ?? null
    if (
      correo !== null &&
      (!/^[^\s@]+@[^\s@]+$/.test(correo) || !correo.endsWith(`@${DOMINIO_INSTITUCIONAL}`))
    )
      fallar('DATOS_INVALIDOS', 'Indica el correo institucional de quien recibe.')
    const id = e.id
    if (!/^[0-9a-f-]{36}$/i.test(id))
      fallar('DATOS_INVALIDOS', 'Identificador de entrega inválido.')
    if (!/^[0-9a-f]{64}$/.test(e.tokenSha256)) fallar('DATOS_INVALIDOS', 'Huella del QR inválida.')
    const previa = ctx.asignaciones.porId(id)
    if (previa) {
      if (
        previa.entregadoPorCorreo !== e.entregadoPor.correo ||
        previa.espacioId !== e.espacioId ||
        previa.evento !== e.evento.trim() ||
        previa.inicio !== inicio ||
        previa.fin !== fin ||
        previa.invitadoCorreo !== correo ||
        previa.tokenSha256 !== e.tokenSha256
      )
        fallar('DATOS_INVALIDOS', 'El identificador ya pertenece a otra entrega.')
      return releer(ctx, id)
    }
    if (new Date(fin).getTime() <= ctx.srv.ahora().getTime())
      fallar('DATOS_INVALIDOS', 'La entrega debe finalizar en una fecha futura.')
    exigirSinCruce(
      ctx.asignaciones.listar(),
      { espacioId: e.espacioId, inicio, fin },
      ctx.srv.ahora(),
      ctx.catalogo.config(),
    )
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
      invitadoCorreo: correo,
      solicitadaEn: null,
      motivoRechazo: null,
      solicitud: null,
      autorizacion: null,
      notifDecision: correo
        ? { estado: 'PENDIENTE', intentos: 0, reservaHasta: '' }
        : SIN_NOTIFICACION,
      notifConfirmacion: correo
        ? { estado: 'PENDIENTE', intentos: 0, reservaHasta: '' }
        : SIN_NOTIFICACION,
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
