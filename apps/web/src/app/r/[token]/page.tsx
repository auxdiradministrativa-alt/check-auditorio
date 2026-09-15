import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FlujoRecepcion } from '@/features/recepcion/flujo-recepcion'
import { PantallaEspera, PantallaExpirada } from '@/features/recepcion/pantallas-estado'
import {
  obtenerCatalogo,
  obtenerEspacio,
  obtenerSesionReceptor,
  obtenerTerminosVigentes,
  resolverToken,
} from '@/lib/datos/repositorio'

export const metadata: Metadata = { title: 'Recepción del espacio' }

type Props = { params: Promise<{ token: string }> }

export default async function Recepcion({ params }: Props) {
  const { token } = await params
  const { estado, asignacion } = await resolverToken(token)
  const sesion = await obtenerSesionReceptor()

  if (estado === 'EXPIRADO') return <PantallaExpirada />
  if (estado === 'EN_ESPERA') return <PantallaEspera sesion={sesion} />

  const [espacio, catalogo, terminos] = await Promise.all([
    obtenerEspacio(asignacion.espacioId),
    obtenerCatalogo(asignacion.espacioId),
    obtenerTerminosVigentes(),
  ])
  if (!espacio) notFound()

  return (
    <FlujoRecepcion
      token={token}
      asignacion={asignacion}
      espacio={espacio}
      catalogo={catalogo}
      sesion={sesion}
      terminos={terminos}
    />
  )
}
