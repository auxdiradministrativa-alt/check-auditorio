'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Link2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

/*
 * Flujo por enlace (spec 2026-09-23): la acción principal es emitir un enlace personal. El
 * formulario del flujo anterior (`form-nueva-asignacion.tsx`) se conserva en el repo pero ya no se
 * monta: crear eventos directamente produciría filas nuevas que pasan por EN_VALIDACION, y la spec
 * fija que ninguna fila nueva entre en ese estado.
 */
const FormEmitirEnlace = dynamic(
  () => import('./form-emitir-enlace').then((m) => m.FormEmitirEnlace),
  {
    loading: () => (
      <p role="status" className="py-6">
        Preparando formulario…
      </p>
    ),
  },
)

export function OperacionEventos({
  eventoId,
  nuevo,
  detalle,
}: {
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
            Operación de eventos
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Emite el enlace de solicitud, aprueba lo que te envían y da seguimiento a la recepción.
          </p>
        </div>
        <Button
          variante="primario"
          onClick={() => setEmitir(!emitir)}
          aria-expanded={emitir}
          aria-controls="emitir-enlace"
        >
          {emitir ? <X aria-hidden /> : <Link2 aria-hidden />}
          {emitir ? 'Cerrar formulario' : 'Emitir enlace'}
        </Button>
      </CardHeader>
      {emitir && (
        <CardBody id="emitir-enlace" className="border-b border-border">
          <div className="mb-5">
            <h3 className="text-card-title">Nuevo enlace de solicitud</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Quien solicita abre el enlace con su cuenta institucional, propone fecha y horario y
              diligencia sus datos. Tú apruebas o devuelves la solicitud desde aquí.
            </p>
          </div>
          <FormEmitirEnlace key={eventoId ?? 'nuevo'} onEmitido={() => setEmitir(false)} />
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
          <p className="max-w-2xl text-sm text-muted-foreground">
            Selecciona una reserva para compartir su enlace, revisar la solicitud, consultar sus
            elementos o administrar la entrega.
          </p>
          <a href="#reservas" className="text-sm font-semibold text-primary-strong hover:underline">
            Ver reservas
          </a>
        </CardBody>
      )}
    </Card>
  )
}
