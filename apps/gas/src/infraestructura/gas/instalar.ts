import { HOJAS, HOJAS_PROTEGIDAS, type NombreHoja } from '../hojas/esquema'
import { isoBogota } from '@check-auditorio/shared/sin-zod'

import { CFG_GENERAL, semilla } from '../hojas/semilla'
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
    } else {
      // Libro existente: las columnas nuevas del esquema se añaden al final, sin tocar datos.
      const actuales = hoja
        .getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1))
        .getDisplayValues()[0]!
        .map((v) => v.trim())
      const faltan = cols.filter((c) => !actuales.includes(c))
      if (faltan.length) {
        const desde = hoja.getLastColumn() + 1
        if (hoja.getMaxColumns() < desde + faltan.length - 1)
          hoja.insertColumnsAfter(hoja.getMaxColumns(), desde + faltan.length - 1 - hoja.getMaxColumns())
        hoja.getRange(1, desde, hoja.getMaxRows(), faltan.length).setNumberFormat('@')
        hoja.getRange(1, desde, 1, faltan.length).setValues([faltan]).setFontWeight('bold')
        console.log(`${nombre}: columnas añadidas ${faltan.join(', ')}`)
      }
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
  // Claves de configuración nuevas en un libro existente: se añaden con su valor por defecto.
  const existentes = general
    .getRange(1, 1, general.getLastRow(), 1)
    .getDisplayValues()
    .map(([c]) => (c ?? '').trim())
  for (const { clave, valor } of CFG_GENERAL)
    if (!existentes.includes(clave)) general.appendRow([clave, valor])
  // Desde cuándo se notifican constancias: las selladas antes no reciben correo de golpe.
  const filasCfg = general.getRange(1, 1, general.getLastRow(), 2).getDisplayValues()
  const iDesde = filasCfg.findIndex(([c]) => c === 'notificaciones_desde')
  if (iDesde >= 0 && !filasCfg[iDesde]![1])
    general.getRange(iDesde + 1, 2).setNumberFormat('@').setValue(isoBogota(new Date()))

  // Activador de la bandeja de correo. Corre como la cuenta que ejecuta `instalar()`: debe ser la
  // dueña, o los correos saldrían desde otra cuenta.
  if (!ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === 'procesarOutbox'))
    ScriptApp.newTrigger('procesarOutbox').timeBased().everyMinutes(10).create()

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
