import type { ElementoCatalogo } from '@check-auditorio/shared'
import { checklistItemInputSchema, recepcionInputSchema } from '@check-auditorio/shared'

import type { DatosReceptor, ErroresItem, ItemEstado } from './tipos'

const esquemaDatos = recepcionInputSchema.pick({
  rol: true,
  dependencia: true,
  cargo: true,
  celular: true,
  asistentesEstimados: true,
})

export type ErroresDatos = Partial<Record<keyof DatosReceptor, string>>

export function validarDatos(datos: DatosReceptor): ErroresDatos {
  const r = esquemaDatos.safeParse({
    ...datos,
    asistentesEstimados: datos.asistentesEstimados === '' ? NaN : Number(datos.asistentesEstimados),
  })
  if (r.success) return {}
  const errores: ErroresDatos = {}
  for (const issue of r.error.issues) {
    const campo = issue.path[0] as keyof DatosReceptor
    errores[campo] ??=
      campo === 'asistentesEstimados' ? 'Indica cuántas personas asistirán.' : issue.message
  }
  return errores
}

export function validarItems(
  elementos: ElementoCatalogo[],
  estados: Record<string, ItemEstado>,
): Record<string, ErroresItem> {
  const errores: Record<string, ErroresItem> = {}
  for (const el of elementos) {
    const item = estados[el.id]
    if (!item || item.estado === null) {
      errores[el.id] = { estado: 'Marca si está conforme o con novedad.' }
      continue
    }
    const e: ErroresItem = {}
    if (
      el.categoria !== 'ESPACIO' &&
      item.estado === 'CONFORME' &&
      item.cantidadRecibida !== el.cantidadEsperada
    ) {
      e.cantidadRecibida = 'La cantidad no coincide con lo entregado: marca Novedad y descríbela.'
    }
    const r = checklistItemInputSchema.safeParse(aItemInput(el, item))
    if (!r.success) {
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as keyof ErroresItem
        e[campo] ??= issue.message
      }
    }
    if (Object.keys(e).length) errores[el.id] = e
  }
  return errores
}

export function aItemInput(el: ElementoCatalogo, item: ItemEstado) {
  return {
    elementoId: el.id,
    cantidadRecibida: el.categoria === 'ESPACIO' ? 1 : item.cantidadRecibida,
    estado: item.estado,
    observacion: item.estado === 'NOVEDAD' ? item.observacion : '',
    fotoIds: item.estado === 'NOVEDAD' ? item.fotos.map((f) => f.id) : [],
  }
}
