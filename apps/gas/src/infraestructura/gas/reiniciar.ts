import { isoBogota } from '@check-auditorio/shared/sin-zod'

import { HOJAS, HOJAS_PROTEGIDAS, type NombreHoja } from '../hojas/esquema'
import { semilla } from '../hojas/semilla'
import { abrirLibro, propiedades } from './propiedades'
import { serviciosGas } from './servicios-gas'

/** Pestañas editables que se vuelven a sembrar: el catálogo de aspectos y los términos. */
const RESEMBRADAS: readonly NombreHoja[] = ['CAT_Elementos', 'CFG_Terminos']

/**
 * Deja el libro listo para el uso real (checklist solo de infraestructura, 2026-09-23): vacía las
 * pestañas de registro, que hasta hoy solo tienen pruebas, y vuelve a sembrar el catálogo y los
 * términos con el encabezado exacto del esquema, sin las columnas retiradas.
 *
 * Se ejecuta a mano desde el editor con la cuenta dueña, UNA vez. Dos seguros:
 *   · Exige la propiedad del script `PERMITIR_REINICIO = SI`, y la borra al terminar: una segunda
 *     ejecución por error no hace nada.
 *   · Antes de tocar nada copia el libro entero en Drive; la URL de la copia sale en el registro.
 * No toca `CAT_Espacios`, `CFG_Entregadores`, `CFG_Destinatarios`, `CFG_General` ni las fotos.
 */
export function reiniciarRegistroDePrueba() {
  const props = propiedades()
  if (props.getProperty('PERMITIR_REINICIO') !== 'SI')
    throw new Error(
      'Reinicio bloqueado. Si de verdad quieres borrar el registro de pruebas, crea la propiedad ' +
        'del script PERMITIR_REINICIO con el valor SI y vuelve a ejecutar.',
    )

  const libro = abrirLibro()
  const respaldo = DriveApp.getFileById(libro.getId()).makeCopy(
    `${libro.getName()} — respaldo antes del reinicio ${isoBogota(new Date())}`,
  )
  console.log(`Respaldo: ${respaldo.getUrl()}`)

  const lock = LockService.getScriptLock()
  lock.waitLock(30_000)
  try {
    const datos = semilla(serviciosGas.sha256Hex)
    for (const nombre of [...HOJAS_PROTEGIDAS, ...RESEMBRADAS]) {
      const hoja = libro.getSheetByName(nombre)
      if (!hoja) throw new Error(`No existe la pestaña ${nombre}: ejecuta instalar().`)
      const cols = [...HOJAS[nombre]]
      // `clear()` borra contenido y formato, no la protección de la pestaña.
      hoja.clear()
      const sobran = hoja.getMaxColumns() - cols.length
      if (sobran > 0) hoja.deleteColumns(cols.length + 1, sobran)
      hoja.getRange(1, 1, hoja.getMaxRows(), cols.length).setNumberFormat('@')
      hoja.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold')
      hoja.setFrozenRows(1)
      const filas = RESEMBRADAS.includes(nombre) ? datos[nombre] : undefined
      if (filas?.length)
        hoja
          .getRange(2, 1, filas.length, cols.length)
          .setValues(filas.map((f) => cols.map((c) => (f as Record<string, string>)[c] ?? '')))
      console.log(`${nombre}: ${filas?.length ?? 0} filas`)
    }
    SpreadsheetApp.flush()
  } finally {
    lock.releaseLock()
  }

  props.deleteProperty('PERMITIR_REINICIO')
  console.log(
    'Listo. El registro quedó vacío y el catálogo es la lista oficial de infraestructura.',
  )
}
