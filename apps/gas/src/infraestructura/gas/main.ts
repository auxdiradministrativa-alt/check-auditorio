import { crearNucleo } from '../../nucleo'
import { serviciosGas } from './servicios-gas'
import { tablaGas } from './tabla-gas'

export { instalar } from './instalar'

/* Entradas globales de la web app. `build.mjs` las expone como funciones de nivel superior. */

const nucleo = crearNucleo(tablaGas, serviciosGas)

const json = (valor: unknown) =>
  ContentService.createTextOutput(JSON.stringify(valor)).setMimeType(ContentService.MimeType.JSON)

export function doPost(e: GoogleAppsScript.Events.DoPost) {
  return json(nucleo.atenderSobre(e.postData?.contents ?? ''))
}

export function doGet() {
  return json({ ok: true, servicio: 'check-auditorio' })
}
