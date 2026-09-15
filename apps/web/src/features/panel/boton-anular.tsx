'use client'

import { Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'

import { anularAsignacion } from './acciones'

export function BotonAnular({ asignacionId }: { asignacionId: string }) {
  const router = useRouter()
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const anular = () => {
    if (!window.confirm('¿Anular esta asignación? El QR dejará de funcionar.')) return
    iniciar(async () => {
      const r = await anularAsignacion(asignacionId)
      if (!r.ok) setError(r.mensaje)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variante="peligro" tamano="sm" onClick={anular} disabled={pendiente}>
        <Ban aria-hidden />
        {pendiente ? 'Anulando…' : 'Anular asignación'}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  )
}
