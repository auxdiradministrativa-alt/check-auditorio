'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  decisionSolicitudInputSchema,
  invitacionInputSchema,
  type InvitacionInput,
} from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion } from '@/servidor/accion'
import { requerirEntregador } from '@/servidor/auth/permisos'
import { registro } from '@/servidor/registro'
import { huella, tokenQr } from '@/servidor/tokens'

const persona = (s: { nombre: string; correo: string }) => ({ nombre: s.nombre, correo: s.correo })

/**
 * Flujo por enlace: Infraestructura emite un enlace personal amarrado al correo de quien solicita.
 * El token se deriva del id igual que el QR del flujo anterior; la hoja guarda solo su huella.
 */
export async function emitirEnlace(entrada: InvitacionInput): Promise<Resultado<{ id: string }>> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    const datos = invitacionInputSchema.parse(entrada)
    const id = randomUUID()
    await registro('invitacion.crear', {
      ...datos,
      id,
      entregadoPor: persona(sesion),
      tokenSha256: huella(tokenQr(id)),
    })
    revalidatePath('/panel', 'layout')
    return { id }
  })
}

/**
 * Aprueba o devuelve una solicitud. `version` es el `solicitadaEn` que vio el gestor: si quien
 * solicita la corrigió entre medias, el núcleo responde ESTADO_INVALIDO y no se decide a ciegas.
 */
export async function decidirSolicitud(
  id: string,
  decision: 'APROBAR' | 'RECHAZAR',
  version: string,
  motivo = '',
): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirEntregador()
    const datos = decisionSolicitudInputSchema.parse({ decision, version, motivo })
    await registro('solicitud.decidir', {
      ...datos,
      id: z.uuid().parse(id),
      actor: persona(sesion),
    })
    revalidatePath('/panel', 'layout')
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
