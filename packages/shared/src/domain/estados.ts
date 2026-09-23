/**
 * Ciclo de vida de una asignación temporal del espacio.
 *
 * INVITADA            → Infraestructura emitió el enlace para una cuenta; falta diligenciar.
 * SOLICITADA          → quien solicita propuso evento y franja; espera aprobación.
 * RECHAZADA           → Infraestructura la devolvió con un motivo; quien solicita la corrige.
 * PROGRAMADA          → aprobada (o creada por Infraestructura en el flujo anterior).
 * EN_VALIDACION       → solo flujo anterior: una cuenta escaneó el QR y espera confirmación.
 * EN_DILIGENCIAMIENTO → quien recibe está llenando la constancia.
 * RECIBIDA            → constancia enviada y sellada.
 * DEVUELTA            → el receptor declaró la devolución.
 * DEVOLUCION_VENCIDA  → pasó el plazo sin declarar la devolución.
 * ANULADA / EXPIRADA  → estados terminales sin recepción.
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
  INVITADA: 'Por diligenciar',
  SOLICITADA: 'Por aprobar',
  RECHAZADA: 'Por corregir',
  PROGRAMADA: 'Programada',
  EN_VALIDACION: 'Por validar',
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
