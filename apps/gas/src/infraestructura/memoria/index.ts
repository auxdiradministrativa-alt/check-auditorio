import { createHash, createHmac, randomUUID } from 'node:crypto'

import type { Servicios } from '../../aplicacion/puertos'
import { crearNucleo } from '../../nucleo'
import { HOJAS, type Fila, type NombreHoja, type Tabla } from '../hojas/esquema'
import { semilla } from '../hojas/semilla'

/*
 * Adaptador en memoria (Node): mismo núcleo y mismas reglas que Apps Script, sin Google.
 * Lo usan la web en desarrollo local y las pruebas. Los datos viven lo que viva el proceso.
 */

const sha256Hex = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')

export function crearTablaMemoria(): Tabla & {
  volcar(): Map<NombreHoja, Record<string, string>[]>
} {
  const libro = new Map<NombreHoja, Record<string, string>[]>()
  for (const hoja of Object.keys(HOJAS) as NombreHoja[]) libro.set(hoja, [])
  for (const [hoja, filas] of Object.entries(semilla(sha256Hex)))
    libro.set(
      hoja as NombreHoja,
      filas.map((f) => ({ ...f })),
    )

  return {
    leer: <H extends NombreHoja>(hoja: H) => libro.get(hoja)!.map((f) => ({ ...f }) as Fila<H>),
    agregar: (hoja, filas) => void libro.get(hoja)!.push(...filas.map((f) => ({ ...f }))),
    actualizar: (hoja, columna, valor, cambios) => {
      const fila = libro.get(hoja)!.find((f) => f[columna as string] === valor)
      if (fila) Object.assign(fila, cambios)
    },
    volcar: () => libro,
  }
}

export function crearServiciosMemoria(
  opciones: { ahora?: () => Date; secreto?: string } = {},
): Servicios {
  const fotos = new Map<string, string>()
  const nonces = new Map<string, number>()
  return {
    conBloqueo: (fn) => fn(),
    registrarNonce: (nonce, segundos) => {
      const t = Date.now()
      if ((nonces.get(nonce) ?? 0) > t) return false
      nonces.set(nonce, t + segundos * 1000)
      return true
    },
    sha256Hex,
    hmacSha256Hex: (secreto, texto) =>
      createHmac('sha256', secreto).update(texto, 'utf8').digest('hex'),
    guardarFoto: (nombre) => {
      const id = `local-${randomUUID()}`
      fotos.set(id, nombre)
      return id
    },
    fotoPertenece: (id, asignacionId) => fotos.get(id)?.startsWith(`${asignacionId}_`) ?? false,
    secretoHmac: () => opciones.secreto ?? 'secreto-local',
    ahora: opciones.ahora ?? (() => new Date()),
    uuid: () => randomUUID(),
  }
}

export function crearNucleoMemoria(opciones?: Parameters<typeof crearServiciosMemoria>[0]) {
  const tabla = crearTablaMemoria()
  return { nucleo: crearNucleo(tabla, crearServiciosMemoria(opciones)), tabla }
}
