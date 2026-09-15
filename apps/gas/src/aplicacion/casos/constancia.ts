import type { Entrada, Salida } from '@check-auditorio/shared/sin-zod'

import { contenidoRecepcion } from '../../dominio/sello'
import type { Contexto } from '../puertos'
import { exigirAsignacion, vista } from './comun'
import { selloDe } from './recepcion'

/** Constancia con verificación de integridad recalculada desde el registro actual. */
export function obtenerConstancia(
  ctx: Contexto,
  { consecutivo }: Entrada<'constancia.obtener'>,
): Salida<'constancia.obtener'> {
  const r = ctx.recepciones.porConsecutivo(consecutivo)
  if (!r) return null
  const a = exigirAsignacion(ctx, r.asignacionId)
  const detalle = ctx.recepciones.detalle(consecutivo)
  const recalculado = ctx.srv.sha256Hex(contenidoRecepcion(r, detalle, a))
  const dev = ctx.devoluciones.porConsecutivo(consecutivo)
  return {
    sello: selloDe(r),
    asignacion: vista(ctx, a),
    espacio: ctx.catalogo.espacios().find((e) => e.id === a.espacioId) ?? {
      id: a.espacioId,
      nombre: a.espacioId,
      ubicacion: '',
      capacidad: 0,
    },
    receptor: { nombre: r.receptor.nombre, correo: r.receptor.correo },
    rol: r.rol,
    dependencia: r.dependencia,
    cargo: r.cargo,
    asistentes: r.asistentes,
    terminosVersion: r.terminosVersion,
    detalle,
    devolucion: dev ? { resultado: dev.resultado, declaradaEn: dev.declaradaEn } : null,
    sha256Recalculado: recalculado,
    integra: recalculado === r.sha256,
  }
}
