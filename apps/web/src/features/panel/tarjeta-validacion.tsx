'use client'

import { Check, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'

import type { Persona } from '@check-auditorio/shared'

import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type Decision = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA'

/** Quien entrega confirma que la cuenta que escaneó el QR es la persona que tiene en frente. */
export function TarjetaValidacion({
  solicitante,
  escaneadoA,
}: {
  solicitante: Persona
  escaneadoA: string
}) {
  const [decision, setDecision] = useState<Decision>('PENDIENTE')

  return (
    <Card className="border-gold-500/50 ring-4 ring-gold-500/10">
      <CardHeader>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gold-700 uppercase">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-500 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-gold-500" />
          </span>
          Solicitud de recepción
        </p>
        <CardTitle className="text-lg">¿Es la persona que tienes en frente?</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-pearl-200 bg-white p-3">
          <Avatar nombre={solicitante.nombre} className="size-12 text-base" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy-900">{solicitante.nombre}</p>
            <p className="truncate text-sm text-ink-600">{solicitante.correo}</p>
            <p className="text-xs text-ink-500">Escaneó el QR a las {escaneadoA}</p>
          </div>
        </div>
        {decision === 'CONFIRMADA' && (
          <Alert tono="ok" icono={<Check />} titulo="Identidad confirmada">
            {solicitante.nombre.split(' ')[0]} ya puede diligenciar la constancia en su celular.
          </Alert>
        )}
        {decision === 'RECHAZADA' && (
          <Alert tono="peligro" icono={<ShieldAlert />} titulo="Solicitud rechazada">
            El QR quedó libre para que lo escanee la persona correcta.
          </Alert>
        )}
      </CardBody>
      {decision === 'PENDIENTE' && (
        <CardFooter className="justify-stretch">
          <Button variante="peligro" className="flex-1" onClick={() => setDecision('RECHAZADA')}>
            <X aria-hidden />
            No es
          </Button>
          <Button variante="primario" className="flex-1" onClick={() => setDecision('CONFIRMADA')}>
            <Check aria-hidden />
            Sí, confirmar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
