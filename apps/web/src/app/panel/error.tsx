'use client'

import { RefreshCw, ServerCrash } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Error de una página del panel (la lectura del registro que hace cada `page.tsx`):
 * se pinta bajo la cabecera y la navegación, sin perder el contexto.
 * Lo que falle en `panel/layout.tsx` —la guarda de sesión— sube al boundary de la raíz.
 */
export default function ErrorDePanel({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string }
  reset: () => void
  /** Next 16 añade `retry` (refresh + reset). `reset` solo limpia el estado y repintaría el mismo error. */
  retry?: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card>
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <ServerCrash className="size-9 text-attention-accent" aria-hidden />
        <h1 className="text-page text-foreground sm:text-page-lg">El registro no respondió</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          La hoja de cálculo tarda unos segundos en responder y esta vez agotó el tiempo de espera.
          Vuelve a intentarlo; si acabas de confirmar algo, recarga y revisa el estado antes de
          repetirlo.
        </p>
        <Button onClick={() => (retry ?? reset)()} className="mt-1">
          <RefreshCw aria-hidden />
          Reintentar
        </Button>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Código para soporte: <span className="tabular">{error.digest}</span>
          </p>
        )}
      </div>
    </Card>
  )
}
