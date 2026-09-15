import 'server-only'

import type { CodigoError, Entrada, NombreAccion, Respuesta, Salida } from '@check-auditorio/shared'

import { connection } from 'next/server'

import { entorno, exigirEntornoCompleto } from '../entorno'
import { enviarAGas } from './cliente-gas'
import { ejecutarEnMemoria } from './cliente-memoria'

/** Error del registro con el código de dominio; las acciones lo convierten en mensaje. */
export class ErrorRegistro extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
  ) {
    super(mensaje)
  }
}

/**
 * Puerto único de datos de la web. Mismo contrato en los dos adaptadores; nada fuera de
 * `servidor/registro` sabe si detrás hay Apps Script o memoria.
 */
export async function registro<A extends NombreAccion>(
  accion: A,
  entrada: Entrada<A>,
): Promise<Salida<A>> {
  // Datos siempre en tiempo de petición: nunca se prerenderizan en el build.
  await connection()
  exigirEntornoCompleto()
  const respuesta: Respuesta<Salida<A>> =
    entorno().registro === 'gas'
      ? await enviarAGas(accion, entrada)
      : ejecutarEnMemoria(accion, entrada)
  if (!respuesta.ok) throw new ErrorRegistro(respuesta.codigo, respuesta.mensaje)
  return respuesta.datos
}
