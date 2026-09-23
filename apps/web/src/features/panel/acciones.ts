'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { nuevaAsignacionInputSchema, type NuevaAsignacionInput } from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion } from '@/servidor/accion'
import { requerirEntregador } from '@/servidor/auth/permisos'
import { registro } from '@/servidor/registro'
import { huella, tokenQr } from '@/servidor/tokens'

const persona = (s: { nombre: string; correo: string }) => ({ nombre: s.nombre, correo: s.correo })

export async function programarAsignacion(
  entrada: NuevaAsignacionInput,
): Promise<Resultado<{ id: string }>> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    const datos = nuevaAsignacionInputSchema.parse(entrada)
    const id = randomUUID()
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

const decision = z.object({ id: z.uuid(), decision: z.enum(['CONFIRMAR', 'RECHAZAR']) })

export async function decidirValidacion(
  id: string,
  valor: 'CONFIRMAR' | 'RECHAZAR',
): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    const d = decision.parse({ id, decision: valor })
    await registro('validacion.decidir', { ...d, actor: persona(sesion) })
    revalidatePath('/panel', 'layout')
  })
}

export async function anularAsignacion(id: string): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    await registro('asignacion.anular', { id: z.uuid().parse(id), actor: persona(sesion) })
    revalidatePath('/panel', 'layout')
  })
}
