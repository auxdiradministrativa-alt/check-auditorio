import type {
  NovedadDevolucion,
  RegistroAsignacion,
  RegistroDetalle,
  RegistroDevolucion,
  RegistroRecepcion,
} from './entidades'

/*
 * Qué se sella. El hash se recalcula en `/verificar` desde lo que hoy dice la hoja: si alguien
 * edita una celda de estos registros, el recálculo difiere y la constancia sale «Alterada».
 */

/** JSON con claves ordenadas (RFC 8785 para registros de texto, enteros y listas). */
export function canonico(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(',')}]`
  if (valor && typeof valor === 'object') {
    const o = valor as Record<string, unknown>
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(valor)
}

const porElemento = <T extends { elementoId: string }>(xs: T[]) =>
  [...xs].sort((a, b) => a.elementoId.localeCompare(b.elementoId))

export function contenidoRecepcion(
  r: RegistroRecepcion,
  detalle: RegistroDetalle[],
  a: RegistroAsignacion,
): string {
  const { sha256: _omitido, ...recepcion } = r
  return canonico({
    recepcion,
    detalle: porElemento(detalle),
    asignacion: {
      id: a.id,
      espacioId: a.espacioId,
      evento: a.evento,
      inicio: a.inicio,
      fin: a.fin,
    },
  })
}

export function contenidoDevolucion(d: RegistroDevolucion, novedades: NovedadDevolucion[]): string {
  const { sha256: _omitido, ...devolucion } = d
  return canonico({ devolucion, novedades: porElemento(novedades) })
}
