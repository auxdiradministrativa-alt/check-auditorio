/*
 * Entrada sin zod para el bundle de Apps Script: solo constantes, fechas y el protocolo.
 * Los tipos de los esquemas se importan con `import type` desde el índice (se borran al compilar).
 */
export type * from './domain/esquemas'
export * from './domain/constantes'
export * from './domain/estados'
export * from './domain/fechas'
export * from './protocolo'
