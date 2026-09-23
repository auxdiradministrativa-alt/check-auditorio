import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PantallaPersonal } from '@/features/recepcion/pantallas-estado'
import { exigirSesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'
import { tokenQr, urlDevolucion } from '@/servidor/tokens'

export const metadata: Metadata = { title: 'Mi solicitud' }

type Props = { params: Promise<{ id: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Enlace estable de los correos: no lleva token, así que la sesión es la única llave. Con la
 * cuenta invitada, deriva el enlace que corresponde al estado; con cualquier otra, o con un id que
 * no existe, la misma pantalla «personal» (no se distingue una cosa de la otra).
 */
export default async function MiSolicitud({ params }: Props) {
  const { id } = await params
  const destino = `/mi-solicitud/${id}`
  const sesion = await exigirSesion(destino)

  const asignacion = UUID.test(id) ? await registro('asignacion.obtener', { id }) : null
  const invitado = asignacion?.invitadoCorreo
  if (!asignacion || !invitado || invitado.toLowerCase() !== sesion.correo.toLowerCase())
    return <PantallaPersonal sesion={sesion} destino={destino} />

  const constancia = ['RECIBIDA', 'DEVUELTA', 'DEVOLUCION_VENCIDA'].includes(asignacion.estado)
  redirect(constancia ? urlDevolucion(asignacion.id) : `/r/${tokenQr(asignacion.id)}`)
}
