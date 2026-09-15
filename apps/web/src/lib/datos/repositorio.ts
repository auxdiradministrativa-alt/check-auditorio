import 'server-only'

import type { Asignacion, ElementoCatalogo, Espacio } from '@check-auditorio/shared'

import {
  MOCK_ASIGNACIONES,
  MOCK_CATALOGO,
  MOCK_ESPACIOS,
  MOCK_RECEPTOR,
  MOCK_TERMINOS,
} from '@/lib/mock/datos'

/*
 * Punto único de acceso a datos para las páginas.
 * Fase 1: devuelve datos de ejemplo.
 * Fase 2: esta misma interfaz llamará a la API de Apps Script (firmada con HMAC).
 */

export type EstadoToken = 'VALIDO' | 'EN_ESPERA' | 'EXPIRADO'

export async function listarEspacios(): Promise<Espacio[]> {
  return MOCK_ESPACIOS
}

export async function obtenerEspacio(id: string): Promise<Espacio | null> {
  return MOCK_ESPACIOS.find((e) => e.id === id) ?? null
}

export async function obtenerCatalogo(espacioId: string): Promise<ElementoCatalogo[]> {
  return MOCK_CATALOGO.filter((e) => e.espacioId === espacioId).sort((a, b) => a.orden - b.orden)
}

export async function listarAsignaciones(): Promise<Asignacion[]> {
  return [...MOCK_ASIGNACIONES].sort((a, b) => a.inicio.localeCompare(b.inicio))
}

export async function obtenerAsignacion(id: string): Promise<Asignacion | null> {
  return MOCK_ASIGNACIONES.find((a) => a.id === id) ?? null
}

export async function obtenerAsignacionPorConsecutivo(
  consecutivo: string,
): Promise<Asignacion | null> {
  return MOCK_ASIGNACIONES.find((a) => a.consecutivo === consecutivo) ?? null
}

/**
 * Resuelve el token del QR. En la interfaz de ejemplo:
 * "espera" → pendiente de validación · "expirado" → vencido · cualquier otro → válido.
 */
export async function resolverToken(
  token: string,
): Promise<{ estado: EstadoToken; asignacion: Asignacion }> {
  const asignacion = MOCK_ASIGNACIONES[2]!
  if (token === 'expirado') return { estado: 'EXPIRADO', asignacion }
  if (token === 'espera') return { estado: 'EN_ESPERA', asignacion }
  return { estado: 'VALIDO', asignacion }
}

/** Sesión simulada del receptor (fase 2: cuenta de Google validada con hd). */
export async function obtenerSesionReceptor() {
  return MOCK_RECEPTOR
}

export async function obtenerTerminosVigentes() {
  return MOCK_TERMINOS
}
