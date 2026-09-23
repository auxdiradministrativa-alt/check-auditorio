import { crearNucleo } from '../../nucleo'
import { correoGas } from './correo-gas'
import { serviciosGas } from './servicios-gas'
import { tablaGas } from './tabla-gas'

export { instalar } from './instalar'
export { reiniciarRegistroDePrueba } from './reiniciar'

/* Entradas globales de la web app. `build.mjs` las expone como funciones de nivel superior. */

const nucleo = crearNucleo(tablaGas, serviciosGas)

const json = (valor: unknown) =>
  ContentService.createTextOutput(JSON.stringify(valor)).setMimeType(ContentService.MimeType.JSON)

export function doPost(e: GoogleAppsScript.Events.DoPost) {
  return json(nucleo.atenderSobre(e.postData?.contents ?? ''))
}

/** La escribe `build.mjs` al final del bundle: identifica el código que sirve esta URL. */
declare const CHECK_AUDITORIO_HUELLA: string | undefined

export function doGet() {
  const huella = typeof CHECK_AUDITORIO_HUELLA === 'string' ? CHECK_AUDITORIO_HUELLA : null
  return json({ ok: true, servicio: 'check-auditorio', huella })
}

/** Lo invoca el activador de tiempo que crea `instalar()` (cada 10 min). */
export function procesarOutbox() {
  console.log(JSON.stringify(nucleo.procesarNotificaciones(correoGas)))
}
