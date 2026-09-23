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
    const previa = ctx.devoluciones.porClave(datos.claveIdempotencia)
    if (previa) {
      if (previa.consecutivo !== a.consecutivo)
        fallar('DATOS_INVALIDOS', 'La clave de envío pertenece a otra devolución.')
      return releer(ctx, asignacionId)
    }
    if (
      typeof datos.claveIdempotencia !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        datos.claveIdempotencia,
      )
    )
      fallar('DATOS_INVALIDOS', 'La clave de envío no es válida.')
    if (
      datos.declaracion !== true ||
      !['BUENAS_CONDICIONES', 'CON_NOVEDADES'].includes(datos.resultado)
    )
      fallar('DATOS_INVALIDOS', 'Confirma la declaración y el estado de devolución.')
    if (a.estado !== 'RECIBIDA' || !a.consecutivo)
      fallar('ESTADO_INVALIDO', 'Esta asignación no tiene una devolución pendiente.')

    const ids = new Set(ctx.catalogo.elementos(a.espacioId).map((e) => e.id))
    const novedades = normalizarNovedades(datos, ids)
    for (const novedad of novedades) {
      for (const fotoId of novedad.fotoIds) {
        if (!ctx.srv.fotoPertenece(fotoId, asignacionId))
          fallar('DATOS_INVALIDOS', 'Una foto no pertenece a esta entrega. Vuelve a adjuntarla.')
      }
    }
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
