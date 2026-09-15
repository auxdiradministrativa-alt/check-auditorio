import { CalendarDays, CircleCheckBig, Clock, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FormDevolucion } from '@/features/devolucion/form-devolucion'
import { formatearFechaHora, formatearFechaLarga, formatearFranja } from '@/lib/fechas'
import { exigirSesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'
import { tokenDevolucionValido } from '@/servidor/tokens'

export const metadata: Metadata = { title: 'Declarar devolución' }

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }

export default async function Devolucion({ params, searchParams }: Props) {
  const [{ id }, { t }] = await Promise.all([params, searchParams])
  if (!tokenDevolucionValido(id, t)) notFound()
  const sesion = await exigirSesion(`/devolucion/${id}?t=${t}`)

  const asignacion = await registro('asignacion.obtener', { id })
  if (!asignacion?.consecutivo) notFound()
  if (asignacion.receptor?.correo.toLowerCase() !== sesion.correo.toLowerCase()) notFound()

  const [{ espacios, elementos }, constancia] = await Promise.all([
    registro('catalogo.listar', {}),
    registro('constancia.obtener', { consecutivo: asignacion.consecutivo }),
  ])
  const espacio = espacios.find((e) => e.id === asignacion.espacioId)

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
      {constancia?.devolucion ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <CircleCheckBig className="size-12 text-ok-700" aria-hidden />
          <p className="max-w-sm text-ink-600">
            Ya declaraste la devolución el {formatearFechaHora(constancia.devolucion.declaradaEn)}.
          </p>
        </div>
      ) : (
        <FormDevolucion
          asignacionId={id}
          token={t!}
          catalogo={elementos.filter((e) => e.espacioId === asignacion.espacioId)}
          evento={asignacion.evento}
        />
      )}
    </div>
  )
}
