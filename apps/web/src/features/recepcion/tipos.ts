import type { EstadoElemento, RolReceptor } from '@check-auditorio/shared'

import type { FotoLocal } from '@/features/fotos/tipos'

export type ItemEstado = {
  estado: EstadoElemento | null
  observacion: string
  fotos: FotoLocal[]
}

export type CambioItem = (actualizar: (previo: ItemEstado) => ItemEstado) => void

export type DatosReceptor = {
  rol: RolReceptor | null
  dependencia: string
  cargo: string
  celular: string
  asistentesEstimados: string
}

export type ErroresItem = Partial<Record<'estado' | 'observacion' | 'fotoIds', string>>
