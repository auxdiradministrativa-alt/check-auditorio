import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FlujoRecepcion } from '@/features/recepcion/flujo-recepcion'
import {
  PantallaExpirada,
  PantallaIngresarPersonal,
  PantallaPersonal,
} from '@/features/recepcion/pantallas-estado'
import { obtenerSesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'
import { listarCatalogo } from '@/servidor/registro/lecturas'
import { huella } from '@/servidor/tokens'

export const metadata: Metadata = { title: 'Recepción del espacio' }

export default async function Recepcion({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [qr, sesion] = await Promise.all([
    registro('qr.estado', { tokenSha256: huella(token) }),
    obtenerSesion(),
  ])
  if (!qr) return <PantallaExpirada />
  const destino = `/r/${token}`
  if (!sesion) return <PantallaIngresarPersonal destino={destino} />
  const { asignacion, vigencia } = qr
  const correo = asignacion.invitadoCorreo ?? asignacion.receptor?.correo
  if (correo && correo.toLowerCase() !== sesion.correo.toLowerCase())
    return <PantallaPersonal sesion={sesion} destino={destino} />
  const esSuya = asignacion.receptor?.correo.toLowerCase() === sesion.correo.toLowerCase()
  if (['RECIBIDA', 'DEVUELTA', 'DEVOLUCION_VENCIDA'].includes(asignacion.estado)) {
    if (esSuya) redirect(`${destino}/confirmada`)
    return <PantallaExpirada />
  }
  if (!['PROGRAMADA', 'EN_DILIGENCIAMIENTO', 'EN_VALIDACION'].includes(asignacion.estado))
    return <PantallaExpirada />
  if (asignacion.estado !== 'PROGRAMADA' && !esSuya) return <PantallaExpirada />
  if (vigencia === 'VENCIDO') return <PantallaExpirada />
  const [{ espacios, elementos }, terminos] = await Promise.all([
    listarCatalogo(),
    registro('terminos.vigentes', {}),
  ])
  const espacio = espacios.find((e) => e.id === asignacion.espacioId)
  if (!espacio) return <PantallaExpirada />
  return (
    <FlujoRecepcion
      token={token}
      asignacion={asignacion}
      espacio={espacio}
      catalogo={elementos.filter((e) => e.espacioId === espacio.id)}
      sesion={sesion}
      terminos={terminos}
      disponible={vigencia === 'VIGENTE'}
    />
  )
}
