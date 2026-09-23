import type {
  DetalleRecepcion,
  EstadoAsignacion,
  Identidad,
  ResultadoDevolucion,
  RolReceptor,
} from '@check-auditorio/shared/sin-zod'

/* Entidades tal como se guardan. Lo que ve la web (`Asignacion`, `Constancia`) se deriva de aquí. */

export interface RegistroAsignacion {
  id: string
  espacioId: string
  evento: string
  inicio: string
  fin: string
  /** Estado guardado; el que se muestra lo calcula `estadoEfectivo` con el reloj. */
  estado: EstadoAsignacion
  entregadoPorCorreo: string
  creadaEn: string
  tokenSha256: string
  tokenVence: string
  receptor: Identidad | null
  consecutivo: string | null
  /* ─── Flujo por enlace (vacíos en las filas del flujo anterior) ─── */
  /** Única cuenta que puede diligenciar y recibir; en minúsculas. */
  invitadoCorreo: string | null
  /** Hora de la última versión diligenciada: el gestor aprueba la que vio. */
  solicitadaEn: string | null
  motivoRechazo: string | null
  solicitud: DatosSolicitante | null
  /** Prueba de la autorización de datos (Ley 1581): cuándo y sobre qué texto exacto. */
  autorizacion: { en: string; version: string; sha256: string } | null
  /** Aviso a quien solicitó de que su solicitud fue aprobada o devuelta. */
  notifDecision: Notificacion
  notifConfirmacion: Notificacion
  notifVencida: Notificacion
}

export interface DatosSolicitante {
  rol: RolReceptor
  dependencia: string
  cargo: string
  celular: string
  asistentes: number
}

/** Bandeja de salida de un correo. `''` = no aplica a esta fila (p. ej. filas anteriores). */
export type EstadoNotificacion = '' | 'PENDIENTE' | 'ENVIANDO' | 'ENVIADO' | 'FALLIDO' | 'OMITIDO'

export interface Notificacion {
  estado: EstadoNotificacion
  intentos: number
  /** Mientras `ENVIANDO`: hasta cuándo es de quien la reservó. Vencida, otro turno la retoma. */
  reservaHasta: string
}

export const SIN_NOTIFICACION: Notificacion = { estado: '', intentos: 0, reservaHasta: '' }

export interface RegistroRecepcion {
  consecutivo: string
  asignacionId: string
  receptor: Identidad
  rol: RolReceptor
  dependencia: string
  cargo: string
  celular: string
  asistentes: number
  terminosVersion: string
  terminosSha256: string
  selladaEn: string
  sha256: string
  codigoVerificacion: string
  claveIdempotencia: string
  userAgent: string
}

export type RegistroDetalle = DetalleRecepcion

export interface RegistroDevolucion {
  consecutivo: string
  resultado: ResultadoDevolucion
  declaradaEn: string
  sha256: string
  claveIdempotencia: string
}

export interface NovedadDevolucion {
  elementoId: string
  observacion: string
  fotoIds: string[]
}

export interface Entregador {
  correo: string
  nombre: string
  activo: boolean
}

export interface Config {
  minutosQrAntes: number
  horasDevolucion: number
  /** Plazo para diligenciar un enlace recién emitido. */
  horasVigenciaInvitacion: number
  /** Base de los enlaces de los correos (sin barra final). */
  urlApp: string
  /** Solo se notifican constancias selladas desde esta hora: evita correos de registros previos. */
  notificacionesDesde: string
}
