import type { DevolucionInput } from '@check-auditorio/shared/sin-zod'

import type { NovedadDevolucion } from './entidades'
import { fallar } from './errores'

export function normalizarNovedades(
  datos: DevolucionInput,
  idsCatalogo: Set<string>,
): NovedadDevolucion[] {
  if (datos.resultado === 'BUENAS_CONDICIONES') return []
  if (!datos.novedades?.length) fallar('DATOS_INVALIDOS', 'Registra al menos una novedad.')
  return datos.novedades.map((n) => {
    if (!idsCatalogo.has(n.elementoId))
      fallar('DATOS_INVALIDOS', 'Novedad sobre un elemento que no está en el catálogo.')
    const observacion = (n.observacion ?? '').trim()
    if (!observacion || !n.fotoIds?.length)
      fallar('DATOS_INVALIDOS', 'Cada novedad necesita observación y foto.')
    return { elementoId: n.elementoId, observacion, fotoIds: n.fotoIds }
  })
}
