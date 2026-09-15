import type { Entrada, NombreAccion, Respuesta, Salida } from '@check-auditorio/shared/sin-zod'

import { ejecutar } from './aplicacion/enrutador'
import type { Servicios } from './aplicacion/puertos'
import { atenderSobre } from './aplicacion/sobre'
import type { Tabla } from './infraestructura/hojas/esquema'
import { crearContexto } from './infraestructura/hojas/repositorios'

/** Raíz de composición: une una `Tabla` y unos `Servicios` concretos con los casos de uso. */
export function crearNucleo(tabla: Tabla, servicios: Servicios) {
  const ctx = crearContexto(tabla, servicios)
  return {
    ejecutar: <A extends NombreAccion>(accion: A, entrada: Entrada<A>): Respuesta<Salida<A>> =>
      ejecutar(ctx, accion, entrada),
    atenderSobre: (cuerpo: string) => atenderSobre(ctx, cuerpo),
  }
}

export type Nucleo = ReturnType<typeof crearNucleo>
