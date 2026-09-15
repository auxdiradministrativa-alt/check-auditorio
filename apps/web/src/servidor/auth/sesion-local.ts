import 'server-only'

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'

import { entorno } from '../entorno'
import type { Sesion } from './sesion'

/* Sesión de desarrollo sin Google: cookie `datos.firma`. `entorno()` impide usarla en producción. */

const COOKIE = 'ca_sesion_local'

const firmar = (valor: string) =>
  createHmac('sha256', entorno().secretoApp).update(valor).digest('base64url')

export async function leerSesionLocal(): Promise<Sesion | null> {
  const crudo = (await cookies()).get(COOKIE)?.value
  if (!crudo) return null
  const [datos, firma] = crudo.split('.')
  if (!datos || !firma) return null
  const esperada = Buffer.from(firmar(datos))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null
  return JSON.parse(Buffer.from(datos, 'base64url').toString('utf8')) as Sesion
}

export async function abrirSesionLocal(nombre: string, correo: string) {
  const sesion: Sesion = {
    nombre,
    correo,
    sub: `local-${createHash('sha256').update(correo).digest('hex').slice(0, 16)}`,
    iniciadaEn: new Date().toISOString(),
  }
  const datos = Buffer.from(JSON.stringify(sesion)).toString('base64url')
  ;(await cookies()).set(COOKIE, `${datos}.${firmar(datos)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export async function cerrarSesionLocal() {
  ;(await cookies()).delete(COOKIE)
}
