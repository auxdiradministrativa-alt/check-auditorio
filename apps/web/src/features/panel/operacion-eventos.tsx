'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { CalendarPlus, X } from 'lucide-react'
import type { Espacio, ElementoCatalogo } from '@check-auditorio/shared'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

const FormNuevaAsignacion = dynamic(
  () => import('./form-nueva-asignacion').then((m) => m.FormNuevaAsignacion),
  {
    loading: () => (
      <p role="status" className="py-6">
        Preparando formulario…
      </p>
    ),
  },
)

export function OperacionEventos({
  espacios,
  elementos,
  eventoId,
  nuevo,
  detalle,
}: {
  espacios: Espacio[]
  elementos: ElementoCatalogo[]
  eventoId: string | undefined
  nuevo: boolean
  detalle: ReactNode
}) {
  const [crear, setCrear] = useState(nuevo)
  return (
    <Card id="operacion" aria-labelledby="titulo-operacion" className="scroll-mt-6">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="titulo-operacion" className="text-section">
            Operación de eventos
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-600">
            Reserva el espacio, entrega el QR y da seguimiento a la recepción.
          </p>
        </div>
        <Button
          variante="primario"
          onClick={() => setCrear(!crear)}
          aria-expanded={crear}
          aria-controls="nuevo-evento"
        >
          <CalendarPlus aria-hidden />
          {crear ? 'Cerrar formulario' : 'Crear evento'}
        </Button>
      </CardHeader>
      {crear && (
        <CardBody id="nuevo-evento" className="border-b border-pearl-200">
          <div className="mb-5">
            <h3 className="text-card">Nuevo evento y QR</h3>
            <p className="mt-1 text-sm text-ink-600">
              Define el espacio y la franja reservada. Al guardar podrás compartir el enlace o
              descargar el QR.
            </p>
          </div>
          <FormNuevaAsignacion
            key={eventoId ?? 'nuevo'}
            espacios={espacios}
            elementos={elementos}
            onCreada={() => setCrear(false)}
          />
        </CardBody>
      )}
      {detalle ? (
        <CardBody>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-pearl-200 pb-3">
            <p className="text-sm font-medium text-ink-600">Evento seleccionado</p>
            <Link
              href="/panel#reservas"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <X className="size-4" aria-hidden />
              Cerrar detalle
            </Link>
          </div>
          {detalle}
        </CardBody>
      ) : (
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-ink-600">
            Selecciona una reserva para abrir su QR, validar al solicitante, consultar sus elementos
            o administrar la entrega.
          </p>
          <a href="#reservas" className="text-sm font-semibold text-navy-700 hover:underline">
            Ver reservas
          </a>
        </CardBody>
      )}
    </Card>
  )
}
