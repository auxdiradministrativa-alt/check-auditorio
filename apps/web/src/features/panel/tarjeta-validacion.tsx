'use client'

import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import type { Persona } from '@check-auditorio/shared'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { decidirValidacion } from './acciones'

/** Quien entrega confirma que la cuenta que escaneó el QR es la persona que tiene en frente. */
export function TarjetaValidacion({
  asignacionId,
  solicitante,
}: {
  asignacionId: string
  solicitante: Persona
}) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const decidir = (decision: 'CONFIRMAR' | 'RECHAZAR') =>
    iniciar(async () => {
      const r = await decidirValidacion(asignacionId, decision)
      if (!r.ok) setError(r.mensaje)
      router.refresh()
    })

  return (
    <Card className="border-gold-500/50 ring-4 ring-gold-500/10">
      <CardHeader>
        <p className="flex items-center gap-2 text-sm font-medium text-ink-600">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-500 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-gold-500" />
          </span>
          Solicitud de recepción
        </p>
        <CardTitle as="h4">¿Es la persona que tienes en frente?</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-pearl-200 bg-white p-3">
          <Avatar nombre={solicitante.nombre} className="size-12 text-base" />
          <div className="min-w-0">
            <p className="font-semibold break-words text-navy-900">{solicitante.nombre}</p>
            <p className="text-sm break-all text-ink-600">{solicitante.correo}</p>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger-700">
            {error}
          </p>
        )}
      </CardBody>
      <CardFooter className="justify-stretch">
        <Button
          variante="peligro"
          className="flex-1"
          disabled={pendiente}
          onClick={() => decidir('RECHAZAR')}
        >
          <X aria-hidden />
          No es
        </Button>
        <Button
          variante="primario"
          className="flex-1"
          disabled={pendiente}
          onClick={() => decidir('CONFIRMAR')}
        >
          <Check aria-hidden />
          Sí, confirmar
        </Button>
      </CardFooter>
    </Card>
  )
}
