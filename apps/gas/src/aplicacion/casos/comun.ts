import { isoBogota, type Asignacion } from '@check-auditorio/shared/sin-zod'

import { aVista } from '../../dominio/asignacion'
import type { RegistroAsignacion } from '../../dominio/entidades'
import { fallar } from '../../dominio/errores'
import type { Contexto } from '../puertos'

export const marcaDeTiempo = (ctx: Contexto) => isoBogota(ctx.srv.ahora())

export const vista = (ctx: Contexto, a: RegistroAsignacion): Asignacion =>
  aVista(a, ctx.catalogo.entregadores(), ctx.srv.ahora(), ctx.catalogo.config())

export const exigirAsignacion = (ctx: Contexto, id: string): RegistroAsignacion =>
  ctx.asignaciones.porId(id) ?? fallar('NO_ENCONTRADO', 'La asignación no existe.')

export const releer = (ctx: Contexto, id: string) => vista(ctx, exigirAsignacion(ctx, id))
