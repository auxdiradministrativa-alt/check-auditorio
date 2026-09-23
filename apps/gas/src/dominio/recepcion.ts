import {
  PREFIJO_CONSECUTIVO,
  LIMITES,
  type ChecklistItemInput,
  type ElementoCatalogo,
} from '@check-auditorio/shared/sin-zod'

import type { RegistroDetalle } from './entidades'
import { fallar } from './errores'

/**
 * Cruza lo que declaró el receptor con el catálogo vigente: los aspectos y sus nombres salen
 * del catálogo, nunca del cliente.
 */
export function construirDetalle(
  elementos: ElementoCatalogo[],
  checklist: ChecklistItemInput[],
): RegistroDetalle[] {
  if (
    !Array.isArray(checklist) ||
    !checklist.length ||
    checklist.some((i) => !i || typeof i !== 'object')
  )
    fallar('DATOS_INVALIDOS', 'Revisa los aspectos del espacio.')
  const items = new Map(checklist.map((i) => [i.elementoId, i]))
  if (items.size !== checklist.length || items.size !== elementos.length)
    fallar('DATOS_INVALIDOS', 'El checklist no corresponde al catálogo vigente del espacio.')

  return elementos.map((el) => {
    const it =
      items.get(el.id) ?? fallar('DATOS_INVALIDOS', `Falta «${el.nombre}» en el checklist.`)
    if (it.observacion != null && typeof it.observacion !== 'string')
      fallar('DATOS_INVALIDOS', 'La observación debe ser texto.')
    const observacion = (it.observacion ?? '').trim()
    const fotoIds = it.fotoIds ?? []
    if (
      !['CONFORME', 'NOVEDAD'].includes(it.estado) ||
      observacion.length > LIMITES.observacionMax ||
      !Array.isArray(fotoIds) ||
      fotoIds.length > LIMITES.fotosPorNovedadMax ||
      fotoIds.some((id) => typeof id !== 'string' || !id.trim()) ||
      new Set(fotoIds).size !== fotoIds.length
    )
      fallar('DATOS_INVALIDOS', `Revisa el estado de «${el.nombre}».`)
    if (it.estado === 'NOVEDAD' && (!observacion || fotoIds.length === 0))
      fallar('DATOS_INVALIDOS', `«${el.nombre}»: la novedad necesita observación y foto.`)
    return {
      elementoId: el.id,
      elementoNombre: el.nombre,
      estado: it.estado,
      observacion: it.estado === 'NOVEDAD' ? observacion : '',
      fotoIds: it.estado === 'NOVEDAD' ? fotoIds : [],
    }
  })
}

export function siguienteConsecutivo(existentes: string[]): string {
  const max = existentes.reduce((m, c) => Math.max(m, Number(c.split('-')[1]) || 0), 0)
  return `${PREFIJO_CONSECUTIVO}-${String(max + 1).padStart(6, '0')}`
}

export function codigoVerificacion(aleatorio: string): string {
  const c = aleatorio.replace(/[^0-9a-f]/gi, '').toUpperCase()
  return `${c.slice(0, 4)}-${c.slice(4, 8)}`
}
