import type { Entrada, Salida } from '@check-auditorio/shared/sin-zod'

import { exigirReceptor } from '../../dominio/asignacion'
import { normalizarNovedades } from '../../dominio/devolucion'
import type { RegistroDevolucion } from '../../dominio/entidades'
import { fallar } from '../../dominio/errores'
import { contenidoDevolucion } from '../../dominio/sello'
import type { Contexto } from '../puertos'
import { exigirAsignacion, marcaDeTiempo, releer } from './comun'

/** La declara solo quien recibió; se admite también con el plazo vencido (queda la hora real). */
export function registrarDevolucion(
  ctx: Contexto,
  { asignacionId, receptor, datos }: Entrada<'devolucion.registrar'>,
): Salida<'devolucion.registrar'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, asignacionId)
    exigirReceptor(a, receptor.sub)
    if (ctx.devoluciones.porClave(datos.claveIdempotencia)) return releer(ctx, asignacionId)
    if (a.estado !== 'RECIBIDA' || !a.consecutivo)
      fallar('ESTADO_INVALIDO', 'Esta asignación no tiene una devolución pendiente.')

    const ids = new Set(ctx.catalogo.elementos(a.espacioId).map((e) => e.id))
    const novedades = normalizarNovedades(datos, ids)
    const registro: RegistroDevolucion = {
      consecutivo: a.consecutivo!,
      resultado: datos.resultado,
      declaradaEn: marcaDeTiempo(ctx),
      sha256: '',
      claveIdempotencia: datos.claveIdempotencia,
    }
    registro.sha256 = ctx.srv.sha256Hex(contenidoDevolucion(registro, novedades))

    ctx.devoluciones.agregar(registro, novedades)
    ctx.asignaciones.actualizar(a.id, { estado: 'DEVUELTA' })
    ctx.bitacora.registrar('devolucion.registrar', registro.consecutivo, receptor.correo, {
      resultado: datos.resultado,
    })
    return releer(ctx, asignacionId)
  })
}
