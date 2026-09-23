import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import type { Asignacion, VigenciaQr } from '@check-auditorio/shared'

import { FlujoRecepcion } from '@/features/recepcion/flujo-recepcion'
import {
  PantallaAprobadaEsperando,
  PantallaAunNoVigente,
  PantallaConfirmar,
  PantallaEnRevision,
  PantallaEspera,
  PantallaExpirada,
  PantallaIngresar,
  PantallaIngresarPersonal,
  PantallaPersonal,
  PantallaSolicitar,
} from '@/features/recepcion/pantallas-estado'
import { FormSolicitud } from '@/features/solicitud/form-solicitud'
import { obtenerSesion, type Sesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'
import { listarCatalogo } from '@/servidor/registro/lecturas'
import { huella } from '@/servidor/tokens'

export const metadata: Metadata = { title: 'Recepción del espacio' }

type Props = { params: Promise<{ token: string }> }

/** Máquina de pantallas del QR: cada estado de la asignación decide qué ve quien escanea. */
export default async function Recepcion({ params }: Props) {
  const { token } = await params
  const [qr, sesion] = await Promise.all([
    registro('qr.estado', { tokenSha256: huella(token) }),
    obtenerSesion(),
  ])
  if (!qr) return <PantallaExpirada />

  const { asignacion, vigencia } = qr

  // Flujo por enlace personal: la puerta es la cuenta invitada, antes de mostrar nada del evento.
  if (asignacion.invitadoCorreo) {
    const personal = await enlacePersonal(token, asignacion, vigencia, sesion)
    if (personal) return personal
  }

  const esSuya =
    !!sesion && asignacion.receptor?.correo.toLowerCase() === sesion.correo.toLowerCase()

  switch (asignacion.estado) {
    case 'PROGRAMADA':
      if (vigencia === 'ANTES') return <PantallaAunNoVigente asignacion={asignacion} />
      if (vigencia === 'VENCIDO') return <PantallaExpirada />
      if (!sesion) return <PantallaIngresar asignacion={asignacion} token={token} />
      return <PantallaSolicitar asignacion={asignacion} sesion={sesion} token={token} />

    case 'EN_VALIDACION':
      return esSuya ? <PantallaEspera sesion={sesion} /> : <PantallaExpirada />

    case 'EN_DILIGENCIAMIENTO': {
      if (!esSuya) return <PantallaExpirada />
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
        />
      )
    }

    case 'RECIBIDA':
    case 'DEVUELTA':
    case 'DEVOLUCION_VENCIDA':
      if (esSuya) redirect(`/r/${token}/confirmada`)
      return <PantallaExpirada />

    default:
      return <PantallaExpirada />
  }
}

/**
 * Pantallas propias del enlace personal. Devuelve `null` para los estados que comparte con el
 * flujo anterior (diligenciamiento, recibida, devuelta…), que siguen su camino de siempre: en
 * ellos el receptor ya es la cuenta invitada.
 */
async function enlacePersonal(
  token: string,
  asignacion: Asignacion,
  vigencia: VigenciaQr,
  sesion: Sesion | null,
) {
  const destino = `/r/${token}`
  if (!sesion) return <PantallaIngresarPersonal destino={destino} />
  if (asignacion.invitadoCorreo?.toLowerCase() !== sesion.correo.toLowerCase())
    return <PantallaPersonal sesion={sesion} destino={destino} />

  switch (asignacion.estado) {
    case 'INVITADA':
    case 'RECHAZADA': {
      const [{ espacios }, terminos] = await Promise.all([
        listarCatalogo(),
        registro('terminos.vigentes', {}),
      ])
      // Un solo espacio en v1: el núcleo lo fijó al emitir el enlace.
      const espacio = espacios.find((e) => e.id === asignacion.espacioId)
      if (!espacio) return <PantallaExpirada />
      return (
        <FormSolicitud
          token={token}
          asignacion={asignacion}
          espacio={espacio}
          terminos={terminos}
        />
      )
    }

    case 'SOLICITADA':
      return <PantallaEnRevision asignacion={asignacion} />

    case 'PROGRAMADA':
      if (vigencia === 'ANTES') return <PantallaAprobadaEsperando asignacion={asignacion} />
      if (vigencia === 'VENCIDO') return <PantallaExpirada />
      return <PantallaConfirmar asignacion={asignacion} sesion={sesion} token={token} />

    default:
      return null
  }
}
