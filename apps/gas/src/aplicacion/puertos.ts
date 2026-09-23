import type { ElementoCatalogo, Espacio, Terminos } from '@check-auditorio/shared/sin-zod'

import type {
  Config,
  Entregador,
  Notificacion,
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
  /** Todo menos la identidad de la fila y lo que se fija al crearla. */
  actualizar(
    id: string,
    cambios: Partial<
      Omit<RegistroAsignacion, 'id' | 'espacioId' | 'entregadoPorCorreo' | 'creadaEn' | 'tokenSha256'>
    >,
  ): void
}

export interface RepoRecepciones {
  porConsecutivo(consecutivo: string): RegistroRecepcion | null
  porClave(claveIdempotencia: string): RegistroRecepcion | null
  consecutivos(): string[]
  detalle(consecutivo: string): RegistroDetalle[]
  /** Encabezado y detalle en una sola operación, dentro del bloqueo. */
  agregar(r: RegistroRecepcion, detalle: RegistroDetalle[]): void
  /**
   * La bandeja del correo de constancia vive fuera de `RegistroRecepcion` a propósito: ese
   * registro entra entero al sello, y el estado de un correo no debe alterar la constancia.
   */
  notificaciones(): { consecutivo: string; notif: Notificacion }[]
  marcarNotificacion(consecutivo: string, notif: Notificacion): void
}

/** Correo saliente. Apps Script lo implementa con MailApp; las pruebas, con una lista. */
export interface Mensaje {
  para: string[]
  asunto: string
  html: string
  texto: string
}

export interface Correo {
  enviar(m: Mensaje): void
  /** Destinatarios que aún se pueden enviar hoy. */
  cuotaRestante(): number
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
  /** Correos activos de `CFG_Destinatarios` para un evento de notificación. */
  destinatarios(evento: 'recepcion' | 'devolucion' | 'novedad' | 'vencida'): string[]
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
