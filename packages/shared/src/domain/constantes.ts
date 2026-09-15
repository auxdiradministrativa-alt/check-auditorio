/** Dominio de Google Workspace autorizado para iniciar sesión y firmar. */
export const DOMINIO_INSTITUCIONAL = 'americana.edu.co'

/** Prefijo del consecutivo de las constancias de recepción (ej. REC-000123). */
export const PREFIJO_CONSECUTIVO = 'REC'

/** Zona horaria oficial para mostrar y registrar fechas. */
export const ZONA_HORARIA = 'America/Bogota'

export const LIMITES = {
  observacionMax: 500,
  observacionMinNovedad: 5,
  fotosPorNovedadMax: 3,
  dependenciaMax: 120,
  cargoMax: 120,
  eventoMax: 160,
} as const
