import { CalendarDays, Clock, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FormDevolucion } from '@/features/devolucion/form-devolucion'
import { obtenerAsignacion, obtenerCatalogo, obtenerEspacio } from '@/lib/datos/repositorio'
import { formatearFechaLarga, formatearFranja } from '@/lib/fechas'

export const metadata: Metadata = { title: 'Declarar devolución' }

type Props = { params: Promise<{ id: string }> }

export default async function Devolucion({ params }: Props) {
  const asignacion = await obtenerAsignacion((await params).id)
  if (!asignacion?.consecutivo) notFound()
  const [espacio, catalogo] = await Promise.all([
    obtenerEspacio(asignacion.espacioId),
    obtenerCatalogo(asignacion.espacioId),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase tabular">
          Devolución · {asignacion.consecutivo}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{asignacion.evento}</h1>
        <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600">
          <div className="flex items-center gap-1.5">
            <dt>
              <MapPin className="size-4" aria-label="Espacio" />
            </dt>
            <dd>{espacio?.nombre}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <CalendarDays className="size-4" aria-label="Fecha" />
            </dt>
            <dd className="first-letter:uppercase">{formatearFechaLarga(asignacion.inicio)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <Clock className="size-4" aria-label="Horario" />
            </dt>
            <dd className="tabular">{formatearFranja(asignacion.inicio, asignacion.fin)}</dd>
          </div>
        </dl>
      </div>
      <FormDevolucion catalogo={catalogo} evento={asignacion.evento} />
    </div>
  )
}
