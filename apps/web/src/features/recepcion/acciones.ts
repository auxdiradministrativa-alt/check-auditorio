'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { recepcionInputSchema, type RecepcionInput, type Sello } from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion, ErrorAccion } from '@/servidor/accion'
import { requerirSesion, requerirSesionParaFirmar } from '@/servidor/auth/permisos'
import { registro } from '@/servidor/registro'
import { huella } from '@/servidor/tokens'

const identidad = (s: { nombre: string; correo: string; sub: string }) => ({
  nombre: s.nombre,
  correo: s.correo,
  sub: s.sub,
})

async function asignacionDelToken(token: string) {
  const estado = await registro('qr.estado', { tokenSha256: huella(token) })
  if (!estado) throw new ErrorAccion('QR_NO_VIGENTE', 'Este QR no existe.')
  return estado.asignacion
}

/** Abre el acta únicamente cuando la persona pulsa Comenzar. */
export async function comenzarRecepcion(token: string): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirSesion()
    const asignacion = await asignacionDelToken(token)
    if (asignacion.invitadoCorreo) {
      await registro('recepcion.iniciar', { id: asignacion.id, receptor: identidad(sesion) })
    } else {
      await registro('qr.reclamar', { tokenSha256: huella(token), receptor: identidad(sesion) })
    }
    revalidatePath('/panel', 'layout')
  })
}

/**
 * Firma: el servidor aporta identidad, hora y catálogo; del cliente solo se toma lo que la
 * persona decide, revalidado con el mismo esquema. El núcleo sella bajo bloqueo.
 */
export async function firmarRecepcion(
  token: string,
  entrada: RecepcionInput,
): Promise<Resultado<Sello>> {
  return ejecutarAccion(async () => {
    const sesion = await requerirSesionParaFirmar()
    const datos = recepcionInputSchema.parse(entrada)
    const asignacion = await asignacionDelToken(token)
    const sello = await registro('recepcion.registrar', {
      asignacionId: asignacion.id,
      receptor: identidad(sesion),
      datos,
      userAgent: (await headers()).get('user-agent') ?? '',
    })
    revalidatePath('/panel', 'layout')
    return sello
  })
}
