import 'server-only'

import { crearNucleoMemoria } from '@check-auditorio/gas/memoria'
import type { Entrada, NombreAccion, Respuesta, Salida } from '@check-auditorio/shared'

/*
 * Desarrollo local sin Google: el mismo núcleo que corre en Apps Script, sobre un libro en
 * memoria. Se guarda en globalThis para sobrevivir a la recarga en caliente de `next dev`.
 */

type Memoria = ReturnType<typeof crearNucleoMemoria>
const global = globalThis as typeof globalThis & { __checkAuditorioMemoria?: Memoria }

export function ejecutarEnMemoria<A extends NombreAccion>(
  accion: A,
  entrada: Entrada<A>,
): Respuesta<Salida<A>> {
  global.__checkAuditorioMemoria ??= crearNucleoMemoria()
  // Copia profunda: igual que por HTTP, el núcleo no comparte referencias con quien llama.
  return global.__checkAuditorioMemoria.nucleo.ejecutar(accion, structuredClone(entrada))
}
