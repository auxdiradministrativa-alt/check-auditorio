import type { CodigoError } from '@check-auditorio/shared'

/** Lo que devuelve toda Server Action al cliente: nunca lanza, nunca filtra detalles internos. */
export type Resultado<T = void> =
  | { ok: true; datos: T }
  | { ok: false; codigo: CodigoError | 'SESION' | 'REAUTENTICAR'; mensaje: string }
