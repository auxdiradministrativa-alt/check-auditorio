import 'server-only'

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import { entorno } from './entorno'

/*
 * Tokens derivados, no almacenados: `HMAC(secreto, propósito|id)`. La hoja solo guarda el
 * SHA-256 del token del QR; el panel puede volver a mostrar el QR porque lo recalcula.
 */

type Proposito = 'qr' | 'devolucion'

const derivar = (proposito: Proposito, asignacionId: string) =>
  createHmac('sha256', entorno().secretoApp)
    .update(`${proposito}|${asignacionId}`)
    .digest('base64url')

export const tokenQr = (asignacionId: string) => derivar('qr', asignacionId)
export const tokenDevolucion = (asignacionId: string) => derivar('devolucion', asignacionId)

export const huella = (token: string) => createHash('sha256').update(token, 'utf8').digest('hex')

export function tokenDevolucionValido(asignacionId: string, token: string | undefined): boolean {
  if (!token) return false
  const a = Buffer.from(tokenDevolucion(asignacionId))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const urlRecepcion = (asignacionId: string) =>
  `${entorno().appUrl}/r/${tokenQr(asignacionId)}`

export const urlDevolucion = (asignacionId: string) =>
  `/devolucion/${asignacionId}?t=${tokenDevolucion(asignacionId)}`
