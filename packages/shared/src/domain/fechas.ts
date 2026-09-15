/** Bogotá no tiene horario de verano: el desfase es fijo. */
const DESFASE_MS = 5 * 60 * 60 * 1000

/** ISO 8601 con desfase `-05:00` y sin milisegundos (ej. 2026-09-15T14:03:00-05:00). */
export function isoBogota(fecha: Date): string {
  return new Date(fecha.getTime() - DESFASE_MS).toISOString().slice(0, 19) + '-05:00'
}
