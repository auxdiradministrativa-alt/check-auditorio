import { HOJAS, HOJAS_PROTEGIDAS, type NombreHoja } from '../hojas/esquema'
import { semilla } from '../hojas/semilla'
import { propiedades } from './propiedades'
import { serviciosGas } from './servicios-gas'

/**
 * Se ejecuta a mano desde el editor con la cuenta dueña. Idempotente: crea lo que falte
 * (libro, pestañas, encabezados, semilla en pestañas vacías, carpeta de fotos, protecciones)
 * y no toca datos existentes.
 */
export function instalar() {
  const props = propiedades()
  const idLibro = props.getProperty('SHEET_ID')
  const libro = idLibro
    ? SpreadsheetApp.openById(idLibro)
    : SpreadsheetApp.create('Check Auditorio — Registro')
  if (!idLibro) props.setProperty('SHEET_ID', libro.getId())

  const datos = semilla(serviciosGas.sha256Hex)
  for (const nombre of Object.keys(HOJAS) as NombreHoja[]) {
    const cols = [...HOJAS[nombre]]
    const hoja = libro.getSheetByName(nombre) ?? libro.insertSheet(nombre)
    if (hoja.getLastRow() === 0) {
      hoja.getRange(1, 1, hoja.getMaxRows(), cols.length).setNumberFormat('@')
      hoja.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold')
      hoja.setFrozenRows(1)
      const filas = datos[nombre]
      if (filas?.length)
        hoja
          .getRange(2, 1, filas.length, cols.length)
          .setValues(filas.map((f) => cols.map((c) => (f as Record<string, string>)[c] ?? '')))
    }
    if (
      HOJAS_PROTEGIDAS.includes(nombre) &&
      hoja.getProtections(SpreadsheetApp.ProtectionType.SHEET).length === 0
    ) {
      const proteccion = hoja
        .protect()
        .setDescription('Solo la escribe el script de Check Auditorio')
      proteccion.removeEditors(proteccion.getEditors())
      if (proteccion.canDomainEdit()) proteccion.setDomainEdit(false)
    }
  }
  for (const sobrante of ['Hoja 1', 'Sheet1']) {
    const h = libro.getSheetByName(sobrante)
    if (h && libro.getSheets().length > 1) libro.deleteSheet(h)
  }

  const general = libro.getSheetByName('CFG_General')!
  const claves = general.getRange(1, 1, general.getLastRow(), 2).getDisplayValues()
  const i = claves.findIndex(([clave]) => clave === 'carpeta_fotos_id')
  if (i >= 0 && !claves[i]![1]) {
    const carpeta = DriveApp.createFolder('Check Auditorio — Fotos')
    general.getRange(i + 1, 2).setValue(carpeta.getId())
  }

  if (!props.getProperty('GAS_HMAC_SECRET'))
    console.warn('Falta GAS_HMAC_SECRET en las propiedades del script.')
  console.log(`Listo. Libro: ${libro.getUrl()}`)
}
