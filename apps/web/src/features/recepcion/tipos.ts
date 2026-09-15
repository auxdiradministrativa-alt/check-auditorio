import type { EstadoElemento, RolReceptor } from '@check-auditorio/shared'

export type FotoLocal = { id: string; url: string; nombre: string }

export type ItemEstado = {
  estado: EstadoElemento | null
  cantidadRecibida: number
  observacion: string
  fotos: FotoLocal[]
}

export type DatosReceptor = {
  rol: RolReceptor | null
  dependencia: string
  cargo: string
  celular: string
  asistentesEstimados: string
}

export type ErroresItem = Partial<
  Record<'estado' | 'cantidadRecibida' | 'observacion' | 'fotoIds', string>
>
