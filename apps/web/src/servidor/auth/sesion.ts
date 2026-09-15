import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import { DOMINIO_INSTITUCIONAL, type Identidad } from '@check-auditorio/shared'

import { entorno, exigirEntornoCompleto } from '../entorno'
import { registro } from '../registro'
import { auth } from './better-auth'
import { leerSesionLocal } from './sesion-local'

export interface Sesion extends Identidad {
  /** ISO de cuando inició sesión: base de la reautenticación antes de firmar. */
  iniciadaEn: string
}

const esInstitucional = (correo: string) =>
  correo.toLowerCase().endsWith(`@${DOMINIO_INSTITUCIONAL}`)

/** Sesión verificada en servidor, o null. Revalida el dominio aunque el proveedor ya lo hizo. */
export async function obtenerSesion(): Promise<Sesion | null> {
  await connection()
  exigirEntornoCompleto()
  let sesion: Sesion | null
  if (entorno().auth === 'local') {
    sesion = await leerSesionLocal()
  } else {
    const s = await auth().api.getSession({ headers: await headers() })
    sesion = s
      ? {
          nombre: s.user.name,
          correo: s.user.email,
          sub: (s.user as { googleSub?: string }).googleSub || s.user.id,
          iniciadaEn: new Date(s.session.createdAt).toISOString(),
        }
      : null
  }
  return sesion && esInstitucional(sesion.correo) ? sesion : null
}

/** Para páginas: sin sesión, al ingreso con retorno a `destino`. */
export async function exigirSesion(destino: string): Promise<Sesion> {
  const sesion = await obtenerSesion()
  if (!sesion) redirect(`/?destino=${encodeURIComponent(destino)}`)
  return sesion
}

export async function esEntregador(sesion: Sesion) {
  return (await registro('entregador.autorizado', { correo: sesion.correo })).autorizado
}

/** Reautenticación reciente antes de firmar (equipos compartidos). */
export const MINUTOS_FIRMA = 60
export const sesionReciente = (s: Sesion) =>
  Date.now() - new Date(s.iniciadaEn).getTime() < MINUTOS_FIRMA * 60_000
