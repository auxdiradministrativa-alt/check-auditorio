/**
 * Entrega: PROGRAMADA → EN_DILIGENCIAMIENTO → RECIBIDA → DEVUELTA.
 * INVITADA/SOLICITADA/RECHAZADA/EN_VALIDACION se leen solo para compatibilidad histórica.
 * ANULADA/EXPIRADA son terminales sin acta; DEVOLUCION_VENCIDA se deriva del reloj.
 */
export const ESTADOS_ASIGNACION = [
  'INVITADA',
  'SOLICITADA',
  'RECHAZADA',
  'PROGRAMADA',
  'EN_VALIDACION',
  'EN_DILIGENCIAMIENTO',
  'RECIBIDA',
  'DEVUELTA',
  'DEVOLUCION_VENCIDA',
  'ANULADA',
  'EXPIRADA',
] as const
export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[number]

export const ESTADOS_ELEMENTO = ['CONFORME', 'NOVEDAD'] as const
export type EstadoElemento = (typeof ESTADOS_ELEMENTO)[number]

export const CATEGORIAS_ELEMENTO = ['EQUIPO', 'MOBILIARIO', 'ESPACIO'] as const
export type CategoriaElemento = (typeof CATEGORIAS_ELEMENTO)[number]

export const ROLES_RECEPTOR = ['DOCENTE', 'ADMINISTRATIVO'] as const
export type RolReceptor = (typeof ROLES_RECEPTOR)[number]

export const RESULTADOS_DEVOLUCION = ['BUENAS_CONDICIONES', 'CON_NOVEDADES'] as const
export type ResultadoDevolucion = (typeof RESULTADOS_DEVOLUCION)[number]

export const ETIQUETAS_ESTADO_ASIGNACION: Record<EstadoAsignacion, string> = {
  INVITADA: 'Registro anterior sin entrega',
  SOLICITADA: 'Registro anterior pendiente',
  RECHAZADA: 'Registro anterior devuelto',
  PROGRAMADA: 'Entrega programada',
  EN_VALIDACION: 'Recepción pendiente',
  EN_DILIGENCIAMIENTO: 'En diligenciamiento',
  RECIBIDA: 'Recibida',
  DEVUELTA: 'Devuelta',
  DEVOLUCION_VENCIDA: 'Devolución vencida',
  ANULADA: 'Anulada',
  EXPIRADA: 'Expirada',
}

export const ETIQUETAS_CATEGORIA: Record<CategoriaElemento, string> = {
  EQUIPO: 'Equipos',
  MOBILIARIO: 'Mobiliario',
  ESPACIO: 'Condiciones del espacio',
}

export const ETIQUETAS_ROL: Record<RolReceptor, string> = {
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
}
