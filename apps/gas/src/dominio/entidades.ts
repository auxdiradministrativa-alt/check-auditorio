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
}

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
}
