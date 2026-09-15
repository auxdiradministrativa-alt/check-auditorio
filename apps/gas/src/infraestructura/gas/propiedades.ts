/*
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   SHEET_ID         id del libro; `instalar()` lo crea y lo guarda si falta
 *   GAS_HMAC_SECRET  el mismo valor que la variable de Vercel
 */

export const propiedades = () => PropertiesService.getScriptProperties()

export function leerPropiedad(clave: 'SHEET_ID' | 'GAS_HMAC_SECRET'): string {
  const valor = propiedades().getProperty(clave)
  if (!valor) throw new Error(`Falta la propiedad del script ${clave}.`)
  return valor
}

export const abrirLibro = () => SpreadsheetApp.openById(leerPropiedad('SHEET_ID'))
