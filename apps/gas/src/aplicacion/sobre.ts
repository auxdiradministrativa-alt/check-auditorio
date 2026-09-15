import {
  cadenaAFirmar,
  VENTANA_FIRMA_SEGUNDOS,
  type Entrada,
  type NombreAccion,
  type Respuesta,
  type Sobre,
} from '@check-auditorio/shared/sin-zod'

import { ejecutar } from './enrutador'
import type { Contexto } from './puertos'

const RECHAZO = {
  ok: false,
  codigo: 'FIRMA_INVALIDA',
  mensaje: 'Solicitud no autorizada.',
} as const

/** Borde HTTP: firma HMAC, ventana de ±5 min y nonce de un solo uso, en ese orden. */
export function atenderSobre(ctx: Contexto, cuerpo: string): Respuesta<unknown> {
  let sobre: Partial<Sobre>
  try {
    sobre = JSON.parse(cuerpo) as Partial<Sobre>
  } catch {
    return RECHAZO
  }
  const { accion, datos, ts, nonce, firma } = sobre
  if (
    typeof accion !== 'string' ||
    typeof datos !== 'string' ||
    typeof ts !== 'number' ||
    typeof nonce !== 'string' ||
    typeof firma !== 'string'
  )
    return RECHAZO
  if (Math.abs(ctx.srv.ahora().getTime() / 1000 - ts) > VENTANA_FIRMA_SEGUNDOS) return RECHAZO

  const esperada = ctx.srv.hmacSha256Hex(
    ctx.srv.secretoHmac(),
    cadenaAFirmar(accion, ts, nonce, ctx.srv.sha256Hex(datos)),
  )
  if (!igualesEnTiempoConstante(esperada, firma)) return RECHAZO
  if (!ctx.srv.registrarNonce(nonce, VENTANA_FIRMA_SEGUNDOS * 2)) return RECHAZO

  let entrada: unknown
  try {
    entrada = JSON.parse(datos)
  } catch {
    return RECHAZO
  }
  return ejecutar(ctx, accion as NombreAccion, entrada as Entrada<NombreAccion>)
}

function igualesEnTiempoConstante(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
