'use client'

import { ClipboardCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { confirmarInicioRecepcion } from './acciones'

/** Abre el checklist: el servidor pasa la solicitud a EN_DILIGENCIAMIENTO y repinta el enlace. */
export function BotonConfirmarRecepcion({ token }: { token: string }) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const confirmar = () =>
    iniciar(async () => {
      const r = await confirmarInicioRecepcion(token)
      if (!r.ok) setError(r.mensaje)
      router.refresh()
    })

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button variante="oro" tamano="lg" bloque onClick={confirmar} disabled={pendiente}>
        <ClipboardCheck aria-hidden />
        {pendiente ? 'Abriendo…' : 'Confirmar recepción'}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
