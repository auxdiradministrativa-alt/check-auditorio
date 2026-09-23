'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { entregaInputSchema, type EntregaInput } from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion } from '@/servidor/accion'
import { requerirEntregador } from '@/servidor/auth/permisos'
import { registro } from '@/servidor/registro'
import { huella, tokenQr } from '@/servidor/tokens'

const persona = (s: { nombre: string; correo: string }) => ({ nombre: s.nombre, correo: s.correo })

/**
 * Infraestructura crea una entrega asociada al correo de quien recibe.
 * El token se deriva del id igual que el QR del flujo anterior; la hoja guarda solo su huella.
 */
export async function crearEntrega(
  entrada: EntregaInput,
  clave: string,
): Promise<Resultado<{ id: string }>> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    const datos = entregaInputSchema.parse(entrada)
    const id = z.uuid().parse(clave)
    await registro('asignacion.crear', {
      ...datos,
      id,
      entregadoPor: persona(sesion),
      tokenSha256: huella(tokenQr(id)),
    })
    revalidatePath('/panel', 'layout')
    return { id }
  })
}

export async function anularAsignacion(id: string): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    await registro('asignacion.anular', { id: z.uuid().parse(id), actor: persona(sesion) })
    revalidatePath('/panel', 'layout')
  })
}
