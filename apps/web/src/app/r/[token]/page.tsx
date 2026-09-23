import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { FlujoRecepcion } from '@/features/recepcion/flujo-recepcion'
import {
  PantallaAunNoVigente,
  PantallaEspera,
  PantallaExpirada,
  PantallaIngresar,
  PantallaSolicitar,
} from '@/features/recepcion/pantallas-estado'
import { obtenerSesion } from '@/servidor/auth/sesion'
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
