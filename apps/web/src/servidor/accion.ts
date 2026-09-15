import 'server-only'

import { unstable_rethrow } from 'next/navigation'
import { ZodError } from 'zod'

import type { Resultado } from '@/lib/resultado'

import { ErrorRegistro } from './registro'

/** Error de borde (sesión, permisos, datos) que se muestra tal cual al usuario. */
export class ErrorAccion extends Error {
  constructor(
    readonly codigo: Extract<Resultado, { ok: false }>['codigo'],
    mensaje: string,
  ) {
    super(mensaje)
  }
}

/** Envoltura común de las Server Actions: traduce errores conocidos y oculta los internos. */
export async function ejecutarAccion<T>(fn: () => Promise<T>): Promise<Resultado<T>> {
  try {
    return { ok: true, datos: await fn() }
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ErrorAccion || error instanceof ErrorRegistro)
      return { ok: false, codigo: error.codigo, mensaje: error.message }
    if (error instanceof ZodError)
      return {
        ok: false,
        codigo: 'DATOS_INVALIDOS',
        mensaje: error.issues[0]?.message ?? 'Datos inválidos.',
      }
    console.error('[accion]', error)
    return { ok: false, codigo: 'INTERNO', mensaje: 'No se pudo completar. Intenta de nuevo.' }
  }
}
