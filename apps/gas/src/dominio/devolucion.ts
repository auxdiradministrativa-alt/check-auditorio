import { LIMITES, type DevolucionInput } from '@check-auditorio/shared/sin-zod'

import type { NovedadDevolucion } from './entidades'
import { fallar } from './errores'

export function normalizarNovedades(
  datos: DevolucionInput,
  idsCatalogo: Set<string>,
): NovedadDevolucion[] {
  if (datos.resultado === 'BUENAS_CONDICIONES') return []
  if (!Array.isArray(datos.novedades) || !datos.novedades.length)
    fallar('DATOS_INVALIDOS', 'Registra al menos una novedad.')
  const vistos = new Set<string>()
  return datos.novedades.map((n) => {
    if (!n || typeof n !== 'object' || vistos.has(n.elementoId))
      fallar('DATOS_INVALIDOS', 'Revisa los elementos de las novedades.')
    vistos.add(n.elementoId)
    if (!idsCatalogo.has(n.elementoId))
      fallar('DATOS_INVALIDOS', 'Novedad sobre un elemento que no está en el catálogo.')
    if (typeof n.observacion !== 'string')
      fallar('DATOS_INVALIDOS', 'La observación debe ser texto.')
    const observacion = (n.observacion ?? '').trim()
    if (
      !observacion ||
      observacion.length > LIMITES.observacionMax ||
      !Array.isArray(n.fotoIds) ||
      !n.fotoIds.length ||
      n.fotoIds.length > LIMITES.fotosPorNovedadMax ||
      n.fotoIds.some((id) => typeof id !== 'string' || !id.trim()) ||
      new Set(n.fotoIds).size !== n.fotoIds.length
    )
      fallar('DATOS_INVALIDOS', 'Cada novedad necesita observación y foto.')
    return { elementoId: n.elementoId, observacion, fotoIds: n.fotoIds }
  })
}
