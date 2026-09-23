import type { Servicios } from '../../aplicacion/puertos'
import { leerPropiedad } from './propiedades'
import { invalidarCache, tablaGas } from './tabla-gas'

const hex = (bytes: GoogleAppsScript.Byte[]) =>
  bytes.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('')

export const serviciosGas: Servicios = {
  conBloqueo: (fn) => {
    const lock = LockService.getScriptLock()
    lock.waitLock(20_000)
    try {
      // Dentro del bloqueo se relee todo: otra ejecución pudo escribir mientras esperábamos.
      invalidarCache()
      return fn()
    } finally {
      SpreadsheetApp.flush()
      lock.releaseLock()
    }
  },

  registrarNonce: (nonce, segundos) => {
    const cache = CacheService.getScriptCache()
    const clave = `nonce:${nonce}`.slice(0, 250)
    if (cache.get(clave)) return false
    cache.put(clave, '1', Math.min(segundos, 21_600))
    return true
  },

  sha256Hex: (texto) =>
    hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8)),

  hmacSha256Hex: (secreto, texto) =>
    hex(Utilities.computeHmacSha256Signature(texto, secreto, Utilities.Charset.UTF_8)),

  guardarFoto: (nombre, mime, base64) => {
    const carpetaId = tablaGas
      .leer('CFG_General')
      .find((f) => f.clave === 'carpeta_fotos_id')?.valor
    if (!carpetaId) throw new Error('Falta carpeta_fotos_id en CFG_General: ejecuta instalar().')
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, nombre)
    return DriveApp.getFolderById(carpetaId).createFile(blob).getId()
  },

  fotoPertenece: (id, asignacionId) => {
    try {
      const archivo = DriveApp.getFileById(id)
      const carpetaId = tablaGas
        .leer('CFG_General')
        .find((f) => f.clave === 'carpeta_fotos_id')?.valor
      if (archivo.isTrashed() || !archivo.getName().startsWith(`${asignacionId}_`)) return false
      const padres = archivo.getParents()
      while (padres.hasNext()) if (padres.next().getId() === carpetaId) return true
      return false
    } catch {
      return false
    }
  },

  secretoHmac: () => leerPropiedad('GAS_HMAC_SECRET'),
  ahora: () => new Date(),
  uuid: () => Utilities.getUuid(),
}
