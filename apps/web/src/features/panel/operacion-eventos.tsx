'use client'

import type { Espacio } from '@check-auditorio/shared'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Link2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

const FormEntrega = dynamic(() => import('./form-entrega').then((m) => m.FormEntrega), {
  loading: () => (
    <p role="status" className="py-6">
      Preparando formulario…
    </p>
  ),
})

export function OperacionEventos({
  espacios,
  eventoId,
  nuevo,
  detalle,
}: {
  espacios: Espacio[]
  eventoId: string | undefined
  nuevo: boolean
  detalle: ReactNode
}) {
  const [emitir, setEmitir] = useState(nuevo)
  const detalleRef = useRef<HTMLDivElement>(null)

  // Al abrir otro evento, el foco llega a su detalle; los refrescos automáticos no lo mueven.
  useEffect(() => {
    if (eventoId) detalleRef.current?.focus({ preventScroll: true })
  }, [eventoId])
  return (
    <Card id="operacion" aria-labelledby="titulo-operacion" className="scroll-mt-16">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="titulo-operacion" className="text-section">
            Entrega de espacios
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Crea la entrega, comparte el enlace y consulta el acta de recepción.
          </p>
        </div>
        <Button
          variante="primario"
          onClick={() => setEmitir(!emitir)}
          aria-expanded={emitir}
          aria-controls="emitir-enlace"
        >
          {emitir ? <X aria-hidden /> : <Link2 aria-hidden />}
          {emitir ? 'Cerrar formulario' : 'Crear entrega'}
        </Button>
      </CardHeader>
      {emitir && (
        <CardBody id="emitir-enlace" className="border-b border-border">
          <div className="mb-5">
            <h3 className="text-card-title">Nueva entrega de espacio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Registra el evento y quién recibe. La persona abre el enlace o escanea el QR y
              diligencia su acta de conformidad.
            </p>
          </div>
          <FormEntrega
            espacios={espacios}
            key={eventoId ?? 'nuevo'}
            onEmitido={() => setEmitir(false)}
          />
        </CardBody>
      )}
      {detalle ? (
        <CardBody
          ref={detalleRef}
          tabIndex={-1}
          aria-label="Evento seleccionado"
          className="focus:outline-none"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <p className="text-sm font-medium text-muted-foreground">Evento seleccionado</p>
            <Link
              href="/panel#entregas"
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
          <p className="max-w-2xl text-sm text-muted-foreground">
            Selecciona una entrega para compartir su enlace, consultar su checklist o revisar el
            acta de recepción.
          </p>
          <a href="#entregas" className="text-sm font-semibold text-primary-strong hover:underline">
            Ver entregas
          </a>
        </CardBody>
      )}
    </Card>
  )
}
