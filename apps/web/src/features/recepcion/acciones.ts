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

/** Quien escaneó se identifica: la asignación pasa a EN_VALIDACION con su cuenta. */
export async function solicitarRecepcion(token: string): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const sesion = await requerirSesion()
    await registro('qr.reclamar', { tokenSha256: huella(token), receptor: identidad(sesion) })
    revalidatePath(`/r/${token}`)
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
