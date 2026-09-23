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
const LECTURAS_DEL_ECO = 4
const ESPERA_ENTRE_LECTURAS_MS = 700

const INTENTOS_DE_CONEXION = 3

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

/** Fallos de undici ANTES de enviar un byte: la petición no llegó a Apps Script. */
const SIN_CONEXION = new Set([
  'UND_ERR_CONNECT_TIMEOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ENETUNREACH',
  'EHOSTUNREACH',
])
const noConecto = (error: unknown) => {
  const causa = error instanceof Error ? error.cause : undefined
  return typeof causa === 'object' && causa !== null && 'code' in causa
    ? SIN_CONEXION.has(String(causa.code))
    : false
}

/** Una respuesta de doPost, y no otra cosa (p. ej. la de doGet, que también trae `ok: true`). */
function esRespuesta(valor: unknown): valor is Respuesta<unknown> {
  if (typeof valor !== 'object' || valor === null || !('ok' in valor)) return false
  return valor.ok === true ? 'datos' in valor : 'codigo' in valor
}

/**
 * POST firmado a la web app de Apps Script (la firma va en el cuerpo: doPost no expone headers).
 *
 * Apps Script ejecuta doPost y responde 302 hacia un «eco» en googleusercontent que guarda el
 * resultado. Medido con este despliegue: a veces ese eco da 404 o redirige a /exec (se leería la
 * salida de doGet). Por eso la redirección se sigue a mano y **se reintenta la lectura del eco,
 * no el POST**: repetirlo ejecutaría la acción dos veces.
 *
 * Única excepción: si la conexión ni se abrió (medido 2026-09-23: la red de la sede corta ~1 de
 * cada 6 conexiones a Google), el POST no salió y se reenvía **el mismo sobre**. Aunque hubiera
 * llegado, Apps Script rechaza el nonce repetido: la acción nunca corre dos veces.
 */
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
  const limite = AbortSignal.timeout(TIEMPO_MAXIMO_MS)

  let res: Response | undefined
  for (let intento = 1; !res; intento++) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(sobre),
        redirect: 'manual',
        cache: 'no-store',
        signal: limite,
      })
    } catch (error) {
      if (intento < INTENTOS_DE_CONEXION && noConecto(error) && !limite.aborted) {
        console.warn(`[gas] ${accion} no conectó (intento ${intento}); se reenvía el mismo sobre`)
        continue
      }
      console.error(`[gas] ${accion} sin respuesta del POST:`, error)
      return {
        ok: false,
        codigo: 'INTERNO',
        mensaje: 'El registro no respondió. Intenta de nuevo.',
      }
    }
  }

  const eco = res.headers.get('location')
  if (!eco) return leer<A>(accion, res)

  let ultimo = ''
  for (let intento = 1; intento <= LECTURAS_DEL_ECO; intento++) {
    try {
      const lectura = await fetch(eco, { redirect: 'manual', cache: 'no-store', signal: limite })
      if (lectura.status === 200) {
        const respuesta = await leer<A>(accion, lectura, intento < LECTURAS_DEL_ECO)
        if (respuesta) return respuesta
      }
      ultimo = `HTTP ${lectura.status}`
    } catch (error) {
      ultimo = String(error)
    }
    if (intento < LECTURAS_DEL_ECO) await esperar(ESPERA_ENTRE_LECTURAS_MS * intento)
  }
  console.error(`[gas] ${accion} el eco no entregó la respuesta (${ultimo})`)
  // La acción pudo ejecutarse: el mensaje no invita a repetir a ciegas.
  return {
    ok: false,
    codigo: 'INTERNO',
    mensaje: 'El registro no confirmó la operación. Recarga la página antes de reintentar.',
  }
}

async function leer<A extends NombreAccion>(
  accion: A,
  res: Response,
  toleraFallo?: false,
): Promise<Respuesta<Salida<A>>>
async function leer<A extends NombreAccion>(
  accion: A,
  res: Response,
  toleraFallo: boolean,
): Promise<Respuesta<Salida<A>> | null>
async function leer<A extends NombreAccion>(accion: A, res: Response, toleraFallo = false) {
  const texto = await res.text()
  try {
    const valor: unknown = JSON.parse(texto)
    if (esRespuesta(valor)) return valor as Respuesta<Salida<A>>
  } catch {
    // se trata abajo
  }
  if (toleraFallo) return null
  console.error(`[gas] ${accion} respuesta inesperada (${res.status}):`, texto.slice(0, 300))
  return { ok: false, codigo: 'INTERNO', mensaje: 'Respuesta inválida del registro.' }
}
