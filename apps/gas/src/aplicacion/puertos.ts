import type { ElementoCatalogo, Espacio, Terminos } from '@check-auditorio/shared/sin-zod'

import type {
  Config,
  Entregador,
  NovedadDevolucion,
  RegistroAsignacion,
  RegistroDetalle,
  RegistroDevolucion,
  RegistroRecepcion,
} from '../dominio/entidades'

/* Puertos: lo que los casos de uso necesitan del mundo. La infraestructura los implementa. */

export interface RepoAsignaciones {
  listar(): RegistroAsignacion[]
  porId(id: string): RegistroAsignacion | null
  porToken(tokenSha256: string): RegistroAsignacion | null
  agregar(a: RegistroAsignacion): void
  actualizar(
    id: string,
    cambios: Partial<Pick<RegistroAsignacion, 'estado' | 'receptor' | 'consecutivo'>>,
  ): void
}

export interface RepoRecepciones {
  porConsecutivo(consecutivo: string): RegistroRecepcion | null
  porClave(claveIdempotencia: string): RegistroRecepcion | null
  consecutivos(): string[]
  detalle(consecutivo: string): RegistroDetalle[]
  /** Encabezado y detalle en una sola operación, dentro del bloqueo. */
  agregar(r: RegistroRecepcion, detalle: RegistroDetalle[]): void
}

export interface RepoDevoluciones {
  porConsecutivo(consecutivo: string): RegistroDevolucion | null
  porClave(claveIdempotencia: string): RegistroDevolucion | null
  agregar(d: RegistroDevolucion, novedades: NovedadDevolucion[]): void
}

export interface RepoCatalogo {
  espacios(): Espacio[]
  elementos(espacioId: string): ElementoCatalogo[]
  terminosVigentes(): Terminos | null
  entregadores(): Entregador[]
  config(): Config
}

export interface Bitacora {
  registrar(evento: string, entidadId: string, actorCorreo: string, datos?: object): void
}

export interface Servicios {
  conBloqueo<T>(fn: () => T): T
  /** Devuelve false si el nonce ya se había visto dentro de la ventana. */
  registrarNonce(nonce: string, segundos: number): boolean
  sha256Hex(texto: string): string
  hmacSha256Hex(secreto: string, texto: string): string
  guardarFoto(nombre: string, mime: string, base64: string): string
  secretoHmac(): string
  ahora(): Date
  uuid(): string
}

export interface Contexto {
  asignaciones: RepoAsignaciones
  recepciones: RepoRecepciones
  devoluciones: RepoDevoluciones
  catalogo: RepoCatalogo
  bitacora: Bitacora
  srv: Servicios
}
