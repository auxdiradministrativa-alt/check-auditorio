/*
 * Estructura del libro (CLAUDE.md §5). `instalar()` escribe estos encabezados; los adaptadores
 * leen y escriben por NOMBRE de columna, así que reordenar columnas a mano no rompe nada.
 */
export const HOJAS = {
  CAT_Espacios: ['id', 'nombre', 'ubicacion', 'capacidad', 'activo'],
  CAT_Elementos: [
    'id',
    'espacio_id',
    'nombre',
    'categoria',
    'cantidad_esperada',
    'orden',
    'activo',
  ],
  CFG_Entregadores: ['correo', 'nombre', 'activo'],
  CFG_Destinatarios: ['correo', 'nombre', 'evento', 'activo'],
  CFG_Terminos: ['version', 'texto_clausulas', 'texto_datos', 'sha256', 'vigente'],
  CFG_General: ['clave', 'valor'],
  Asignaciones: [
    'id',
    'espacio_id',
    'evento',
    'inicio',
    'fin',
    'estado',
    'entregado_por',
    'creada_en',
    'token_sha256',
    'token_vence',
    'receptor_correo',
    'receptor_nombre',
    'receptor_sub',
    'consecutivo',
  ],
  Recepciones: [
    'consecutivo',
    'asignacion_id',
    'receptor_nombre',
    'receptor_correo',
    'receptor_sub',
    'rol',
    'dependencia',
    'cargo',
    'celular',
    'asistentes',
    'terminos_version',
    'terminos_sha256',
    'sellada_en',
    'sha256',
    'codigo_verificacion',
    'clave_idempotencia',
    'user_agent',
    'notificacion',
    'notif_intentos',
    'notif_reserva_hasta',
  ],
  Recepcion_Detalle: [
    'consecutivo',
    'elemento_id',
    'elemento_nombre',
    'categoria',
    'cantidad_esperada',
    'cantidad_recibida',
    'estado',
    'observacion',
    'foto_ids',
  ],
  Devoluciones: [
    'consecutivo',
    'resultado',
    'declarada_en',
    'sha256',
    'clave_idempotencia',
    'notificacion',
    'notif_intentos',
    'notif_reserva_hasta',
  ],
  Devolucion_Detalle: ['consecutivo', 'elemento_id', 'observacion', 'foto_ids'],
  Bitacora: ['ts', 'evento', 'entidad_id', 'actor_correo', 'datos_json'],
} as const

export type NombreHoja = keyof typeof HOJAS
export type Fila<H extends NombreHoja> = Record<(typeof HOJAS)[H][number], string>

/** Solo las escribe el script: se protegen y todas sus celdas son texto plano. */
export const HOJAS_PROTEGIDAS: readonly NombreHoja[] = [
  'Asignaciones',
  'Recepciones',
  'Recepcion_Detalle',
  'Devoluciones',
  'Devolucion_Detalle',
  'Bitacora',
]

/** Almacén tabular mínimo que implementan Apps Script y la memoria. */
export interface Tabla {
  leer<H extends NombreHoja>(hoja: H): Fila<H>[]
  agregar<H extends NombreHoja>(hoja: H, filas: Fila<H>[]): void
  /** Modifica la primera fila cuya `columna` vale `valor`. */
  actualizar<H extends NombreHoja>(
    hoja: H,
    columna: keyof Fila<H>,
    valor: string,
    cambios: Partial<Fila<H>>,
  ): void
}
