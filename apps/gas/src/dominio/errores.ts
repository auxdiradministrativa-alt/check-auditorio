import type { CodigoError } from '@check-auditorio/shared/sin-zod'

/** Violación de una regla de negocio; el enrutador la convierte en `{ ok: false }`. */
export class ErrorDominio extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
  ) {
    super(mensaje)
  }
}

export const fallar = (codigo: CodigoError, mensaje: string): never => {
  throw new ErrorDominio(codigo, mensaje)
}
