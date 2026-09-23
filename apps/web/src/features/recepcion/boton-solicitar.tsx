'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { solicitarRecepcion } from './acciones'

export function BotonSolicitar({ token }: { token: string }) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const solicitar = () =>
    iniciar(async () => {
      const r = await solicitarRecepcion(token)
      if (!r.ok) setError(r.mensaje)
      router.refresh()
    })

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button variante="primario" tamano="lg" bloque onClick={solicitar} disabled={pendiente}>
        {pendiente ? 'Enviando…' : 'Soy yo, solicitar recepción'}
        <ArrowRight aria-hidden />
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
