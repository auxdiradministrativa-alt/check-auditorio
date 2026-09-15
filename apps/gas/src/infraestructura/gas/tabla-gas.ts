import type { Fila, NombreHoja, Tabla } from '../hojas/esquema'
import { abrirLibro } from './propiedades'

/*
 * `Tabla` sobre SpreadsheetApp. Lee con getDisplayValues (texto tal cual se ve) y escribe con
 * formato de texto plano; lo que empieza por = + - @ se escapa con apóstrofo para que la hoja
 * no lo interprete como fórmula. Caché por ejecución, invalidada en cada escritura.
 */

const cache = new Map<NombreHoja, Record<string, string>[]>()
let libro: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null

export const invalidarCache = () => cache.clear()

function hoja(nombre: NombreHoja) {
  libro = libro ?? abrirLibro()
  const h = libro.getSheetByName(nombre)
  if (!h) throw new Error(`No existe la pestaña ${nombre}: ejecuta instalar().`)
  return h
}

const encabezados = (h: GoogleAppsScript.Spreadsheet.Sheet) =>
  (h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1)).getDisplayValues()[0] ?? []).map((v) =>
    v.trim(),
  )

const escapar = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v)

function leerCrudo(nombre: NombreHoja) {
  const enCache = cache.get(nombre)
  if (enCache) return enCache
  const h = hoja(nombre)
  const cols = encabezados(h)
  const n = h.getLastRow() - 1
  const filas =
    n <= 0
      ? []
      : h
          .getRange(2, 1, n, cols.length)
          .getDisplayValues()
          .map((valores, i) => ({
            fila: i + 2,
            datos: Object.fromEntries(cols.map((c, j) => [c, valores[j] ?? ''])),
          }))
          .filter((f) => Object.values(f.datos).some((v) => v !== ''))
          .map((f) => ({ ...f.datos, __fila: String(f.fila) }))
  cache.set(nombre, filas)
  return filas
}

const sinFila = (f: Record<string, string>) => {
  const { __fila: _omitida, ...resto } = f
  return resto
}

export const tablaGas: Tabla = {
  leer: <H extends NombreHoja>(nombre: H) => leerCrudo(nombre).map((f) => sinFila(f) as Fila<H>),

  agregar: (nombre, filas) => {
    if (!filas.length) return
    const h = hoja(nombre)
    const cols = encabezados(h)
    const valores = filas.map((f) =>
      cols.map((c) => escapar((f as Record<string, string>)[c] ?? '')),
    )
    h.getRange(h.getLastRow() + 1, 1, valores.length, cols.length)
      .setNumberFormat('@')
      .setValues(valores)
    cache.delete(nombre)
  },

  actualizar: (nombre, columna, valor, cambios) => {
    const h = hoja(nombre)
    const cols = encabezados(h)
    const objetivo = leerCrudo(nombre).find((f) => f[columna as string] === valor)
    if (!objetivo) return
    const fila = Number(objetivo.__fila)
    for (const [c, v] of Object.entries(cambios)) {
      const j = cols.indexOf(c)
      if (j >= 0)
        h.getRange(fila, j + 1)
          .setNumberFormat('@')
          .setValue(escapar(String(v)))
    }
    cache.delete(nombre)
  },
}
