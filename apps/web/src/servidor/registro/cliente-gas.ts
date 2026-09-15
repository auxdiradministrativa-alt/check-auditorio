import 'server-only'

import { createHash, createHmac, randomUUID } from 'node:crypto'

import {
  cadenaAFirmar,
  type Entrada,
  type NombreAccion,
  type Respuesta,
  type Salida,
  type Sobre,
} from '@check-auditorio/shared'

import { entorno } from '../entorno'

const TIEMPO_MAXIMO_MS = 30_000

/** POST firmado a la web app de Apps Script (la firma va en el cuerpo: doPost no expone headers). */
export async function enviarAGas<A extends NombreAccion>(
  accion: A,
  entrada: Entrada<A>,
): Promise<Respuesta<Salida<A>>> {
  const { url, secreto } = entorno().gas
  const datos = JSON.stringify(entrada)
  const ts = Math.floor(Date.now() / 1000)
  const nonce = randomUUID()
  const firma = createHmac('sha256', secreto)
    .update(
      cadenaAFirmar(accion, ts, nonce, createHash('sha256').update(datos, 'utf8').digest('hex')),
    )
    .digest('hex')
  const sobre: Sobre = { accion, datos, ts, nonce, firma }

  let res: Response
  try {
    // Apps Script responde 302 hacia googleusercontent; fetch lo sigue con GET y trae el JSON.
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(sobre),
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    })
  } catch {
    return { ok: false, codigo: 'INTERNO', mensaje: 'El registro no respondió. Intenta de nuevo.' }
  }
  const texto = await res.text()
  try {
    return JSON.parse(texto) as Respuesta<Salida<A>>
  } catch {
    console.error(`[gas] ${accion} respuesta no JSON (${res.status}):`, texto.slice(0, 300))
    return { ok: false, codigo: 'INTERNO', mensaje: 'Respuesta inválida del registro.' }
  }
}
