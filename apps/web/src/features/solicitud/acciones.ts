'use server'

import { revalidatePath } from 'next/cache'

import { solicitudInputSchema, type SolicitudInput } from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion, ErrorAccion } from '@/servidor/accion'
import { requerirSesion } from '@/servidor/auth/permisos'
import type { Sesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'
import { huella } from '@/servidor/tokens'

/*
 * Lado del solicitante en el flujo por enlace personal. La identidad sale SIEMPRE de la sesión y
 * el id de la asignación, del token (la capacidad que recibió): del cliente solo se toma lo que la
 * persona diligencia, revalidado con el mismo esquema. El núcleo exige además que el correo de la
 * sesión sea el invitado.
 */

const identidad = (s: Sesion) => ({ nombre: s.nombre, correo: s.correo, sub: s.sub })

async function asignacionDelEnlace(token: string, sesion: Sesion) {
  const qr = await registro('qr.estado', { tokenSha256: huella(token) })
  if (!qr) throw new ErrorAccion('QR_NO_VIGENTE', 'Este enlace no existe o ya no está vigente.')
  const invitado = qr.asignacion.invitadoCorreo
  if (!invitado || invitado.toLowerCase() !== sesion.correo.toLowerCase())
    throw new ErrorAccion(
      'NO_AUTORIZADO',
      'Este enlace es personal: ábrelo con la cuenta a la que fue enviado.',
    )
  return qr.asignacion
}

/** Envía (o corrige, si fue rechazada) la solicitud: la asignación pasa a SOLICITADA. */
export async function enviarSolicitud(token: string, entrada: SolicitudInput): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirSesion()
    const datos = solicitudInputSchema.parse(entrada)
    const asignacion = await asignacionDelEnlace(token, sesion)
    await registro('solicitud.diligenciar', {
      id: asignacion.id,
      receptor: identidad(sesion),
      datos,
    })
    // Repinta el enlace desde el registro: la pantalla «En revisión» la pinta el servidor.
    revalidatePath(`/r/${token}`)
    revalidatePath('/panel', 'layout')
  })
}

/** Dentro de la vigencia, abre el checklist: la asignación pasa a EN_DILIGENCIAMIENTO. */
export async function confirmarInicioRecepcion(token: string): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirSesion()
    const asignacion = await asignacionDelEnlace(token, sesion)
    await registro('recepcion.iniciar', { id: asignacion.id, receptor: identidad(sesion) })
    revalidatePath(`/r/${token}`)
    revalidatePath('/panel', 'layout')
  })
}
