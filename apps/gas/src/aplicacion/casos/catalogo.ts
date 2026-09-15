import type { Entrada, Salida } from '@check-auditorio/shared/sin-zod'

import { fallar } from '../../dominio/errores'
import type { Contexto } from '../puertos'

export function listarCatalogo(ctx: Contexto): Salida<'catalogo.listar'> {
  const espacios = ctx.catalogo.espacios()
  return { espacios, elementos: espacios.flatMap((e) => ctx.catalogo.elementos(e.id)) }
}

export function entregadorAutorizado(
  ctx: Contexto,
  { correo }: Entrada<'entregador.autorizado'>,
): Salida<'entregador.autorizado'> {
  const c = correo.trim().toLowerCase()
  return {
    autorizado: ctx.catalogo.entregadores().some((e) => e.activo && e.correo.toLowerCase() === c),
  }
}

export function terminosVigentes(ctx: Contexto): Salida<'terminos.vigentes'> {
  return (
    ctx.catalogo.terminosVigentes() ??
    fallar('INTERNO', 'No hay términos vigentes en CFG_Terminos.')
  )
}
