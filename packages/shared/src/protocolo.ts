import type {
  Asignacion,
  DecisionSolicitudInput,
  DevolucionInput,
  ElementoCatalogo,
  Espacio,
  InvitacionInput,
  NuevaAsignacionInput,
  Persona,
  RecepcionInput,
  SolicitudInput,
} from './domain/esquemas'
import type {
  CategoriaElemento,
  EstadoElemento,
  ResultadoDevolucion,
  RolReceptor,
} from './domain/estados'

/*
 * Contrato entre la web (Vercel) y el núcleo (Apps Script, o memoria en local).
 * La web valida la forma con zod y aporta la identidad de la sesión; el núcleo aplica
 * las reglas del dominio bajo bloqueo y es el único que escribe.
 */

/** Cuenta de Google verificada por la web (`sub` es el identificador estable). */
export interface Identidad extends Persona {
  sub: string
}

export interface Terminos {
  version: string
  clausulas: string[]
  tratamientoDatos: string
  sha256: string
}

export interface DetalleRecepcion {
  elementoId: string
  elementoNombre: string
  categoria: CategoriaElemento
  cantidadEsperada: number
  cantidadRecibida: number
  estado: EstadoElemento
  observacion: string
  fotoIds: string[]
}

export interface Sello {
  consecutivo: string
  asignacionId: string
  selladaEn: string
  sha256: string
  codigoVerificacion: string
}

export interface Constancia {
  sello: Sello
  asignacion: Asignacion
  espacio: Espacio
  receptor: Persona
  rol: RolReceptor
  dependencia: string
  cargo: string
  asistentes: number
  terminosVersion: string
  detalle: DetalleRecepcion[]
  devolucion: { resultado: ResultadoDevolucion; declaradaEn: string } | null
  /** Hash recalculado desde lo que hoy dice la hoja. */
  sha256Recalculado: string
  integra: boolean
}

export type VigenciaQr = 'ANTES' | 'VIGENTE' | 'VENCIDO'

export interface Acciones {
  'catalogo.listar': {
    entrada: Record<string, never>
    salida: { espacios: Espacio[]; elementos: ElementoCatalogo[] }
  }
  'entregador.autorizado': { entrada: { correo: string }; salida: { autorizado: boolean } }
  'terminos.vigentes': { entrada: Record<string, never>; salida: Terminos }
  'asignacion.crear': {
    /** `id` lo genera la web: el token del QR se deriva de él y así puede volver a mostrarse. */
    entrada: NuevaAsignacionInput & { id: string; entregadoPor: Persona; tokenSha256: string }
    salida: Asignacion
  }
  'asignacion.listar': { entrada: Record<string, never>; salida: Asignacion[] }
  'asignacion.obtener': { entrada: { id: string }; salida: Asignacion | null }
  'asignacion.anular': { entrada: { id: string; actor: Persona }; salida: Asignacion }
  'qr.estado': {
    entrada: { tokenSha256: string }
    salida: { asignacion: Asignacion; vigencia: VigenciaQr } | null
  }
  /** Solo flujo anterior: rechaza las asignaciones emitidas con enlace personal. */
  'qr.reclamar': { entrada: { tokenSha256: string; receptor: Identidad }; salida: Asignacion }
  /** Flujo por enlace. `id` lo genera la web, como en `asignacion.crear`. */
  'invitacion.crear': {
    entrada: InvitacionInput & { id: string; entregadoPor: Persona; tokenSha256: string }
    salida: Asignacion
  }
  'solicitud.diligenciar': {
    entrada: { id: string; receptor: Identidad; datos: SolicitudInput }
    salida: Asignacion
  }
  'solicitud.decidir': {
    entrada: DecisionSolicitudInput & { id: string; actor: Persona }
    salida: Asignacion
  }
  /** Quien solicitó abre el checklist dentro de la vigencia (desde `inicio − N min` hasta `fin`). */
  'recepcion.iniciar': { entrada: { id: string; receptor: Identidad }; salida: Asignacion }
  'validacion.decidir': {
    entrada: { id: string; decision: 'CONFIRMAR' | 'RECHAZAR'; actor: Persona }
    salida: Asignacion
  }
  'foto.subir': {
    entrada: { asignacionId: string; actor: Identidad; mime: string; base64: string }
    salida: { id: string }
  }
  'recepcion.registrar': {
    entrada: {
      asignacionId: string
      receptor: Identidad
      datos: RecepcionInput
      userAgent: string
    }
    salida: Sello
  }
  'devolucion.registrar': {
    entrada: { asignacionId: string; receptor: Identidad; datos: DevolucionInput }
    salida: Asignacion
  }
  'constancia.obtener': { entrada: { consecutivo: string }; salida: Constancia | null }
}

export type NombreAccion = keyof Acciones
export type Entrada<A extends NombreAccion> = Acciones[A]['entrada']
export type Salida<A extends NombreAccion> = Acciones[A]['salida']

export type CodigoError =
  | 'FIRMA_INVALIDA'
  | 'NO_AUTORIZADO'
  | 'NO_ENCONTRADO'
  | 'ESTADO_INVALIDO'
  | 'QR_NO_VIGENTE'
  | 'DATOS_INVALIDOS'
  | 'INTERNO'

export type Respuesta<T> =
  { ok: true; datos: T } | { ok: false; codigo: CodigoError; mensaje: string }

/** Cuerpo del POST a Apps Script. `datos` va como texto JSON para que el hash sea exacto. */
export interface Sobre {
  accion: NombreAccion
  datos: string
  ts: number
  nonce: string
  firma: string
}

/** `firma = HMAC-SHA256(secret, accion|ts|nonce|sha256(datos))` en hex. */
export const cadenaAFirmar = (accion: string, ts: number, nonce: string, datosSha256: string) =>
  `${accion}|${ts}|${nonce}|${datosSha256}`

export const VENTANA_FIRMA_SEGUNDOS = 300
