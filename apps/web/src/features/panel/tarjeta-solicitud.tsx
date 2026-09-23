'use client'

import { Check, Undo2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { LIMITES, type Persona } from '@check-auditorio/shared'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/field'

import { decidirSolicitud } from './acciones'

/** Par etiqueta–valor ya formateado en servidor (fechas en hora de Bogotá, sin desajuste al hidratar). */
export type DatoSolicitud = { etiqueta: string; valor: string }

export function ListaDatos({ datos }: { datos: DatoSolicitud[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {datos.map(({ etiqueta, valor }) => (
        <div key={etiqueta} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
          <dd className="font-medium break-words text-foreground">{valor || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Infraestructura revisa lo que propuso quien solicita y lo aprueba o lo devuelve con un motivo.
 * Envía `version` (el `solicitadaEn` que se está mostrando): si la solicitud cambió después, el
 * núcleo la rechaza y el panel se refresca con la versión nueva.
 */
export function TarjetaSolicitud({
  asignacionId,
  version,
  solicitante,
  datos,
}: {
  asignacionId: string
  version: string
  solicitante: Persona
  datos: DatoSolicitud[]
}) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const [decision, setDecision] = useState<'APROBAR' | 'RECHAZAR' | null>(null)
  const [devolviendo, setDevolviendo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState<string | undefined>()
  const motivoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (devolviendo) motivoRef.current?.focus()
  }, [devolviendo])

  const decidir = (valor: 'APROBAR' | 'RECHAZAR') => {
    const texto = motivo.trim()
    if (valor === 'RECHAZAR' && texto.length < LIMITES.motivoMin) {
      setErrorMotivo(`Explica qué debe corregir (mínimo ${LIMITES.motivoMin} caracteres).`)
      motivoRef.current?.focus()
      return
    }
    setErrorMotivo(undefined)
    iniciar(async () => {
      setDecision(valor)
      setError(null)
      setAviso('')
      const r = await decidirSolicitud(
        asignacionId,
        valor,
        version,
        valor === 'RECHAZAR' ? texto : '',
      )
      if (r.ok)
        setAviso(
          valor === 'APROBAR'
            ? 'Solicitud aprobada. El espacio queda reservado.'
            : 'Solicitud devuelta para corregir.',
        )
      else setError(r.mensaje)
      router.refresh()
    })
  }

  return (
    <Card className="border-attention-accent/50 ring-4 ring-attention-accent/10">
      <CardHeader>
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-attention-accent opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-attention-accent" />
          </span>
          Solicitud por aprobar
        </p>
        <CardTitle as="h4">¿Apruebas esta reserva del espacio?</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <Avatar nombre={solicitante.nombre} className="size-12 text-base" />
          <div className="min-w-0">
            <p className="font-semibold break-words text-foreground">{solicitante.nombre}</p>
            <p className="text-sm break-all text-muted-foreground">{solicitante.correo}</p>
          </div>
        </div>
        <ListaDatos datos={datos} />
        {devolviendo && (
          <Field
            id={`motivo-${asignacionId}`}
            label="Qué debe corregir"
            hint="Quien solicita verá este motivo al abrir su enlace."
            error={errorMotivo}
          >
            <Textarea
              ref={motivoRef}
              id={`motivo-${asignacionId}`}
              value={motivo}
              maxLength={LIMITES.motivoMax}
              required
              aria-invalid={!!errorMotivo}
              aria-describedby={
                errorMotivo ? `motivo-${asignacionId}-error` : `motivo-${asignacionId}-hint`
              }
              placeholder="Ej. El auditorio ya está reservado de 2 a 4 p. m.; propón otra franja."
              onChange={(e) => setMotivo(e.target.value)}
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <p role="status" className="text-sm text-muted-foreground empty:hidden">
          {pendiente
            ? decision === 'APROBAR'
              ? 'Aprobando la solicitud…'
              : 'Devolviendo la solicitud…'
            : aviso}
        </p>
      </CardBody>
      <CardFooter className="flex-wrap justify-stretch">
        {devolviendo ? (
          <>
            <Button
              variante="secundario"
              className="flex-1"
              disabled={pendiente}
              onClick={() => {
                setDevolviendo(false)
                setErrorMotivo(undefined)
              }}
            >
              <X aria-hidden />
              Cancelar
            </Button>
            <Button
              variante="peligro"
              className="flex-1"
              disabled={pendiente}
              onClick={() => decidir('RECHAZAR')}
            >
              <Undo2 aria-hidden />
              {pendiente && decision === 'RECHAZAR' ? 'Devolviendo…' : 'Enviar devolución'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variante="peligro"
              className="flex-1"
              disabled={pendiente}
              onClick={() => setDevolviendo(true)}
            >
              <Undo2 aria-hidden />
              Devolver para corregir
            </Button>
            <Button
              variante="primario"
              className="flex-1"
              disabled={pendiente}
              onClick={() => decidir('APROBAR')}
            >
              <Check aria-hidden />
              {pendiente && decision === 'APROBAR' ? 'Aprobando…' : 'Aprobar'}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
