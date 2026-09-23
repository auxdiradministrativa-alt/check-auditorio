'use client'

import { RefreshCw, ServerCrash } from 'lucide-react'
import { useEffect } from 'react'

import { Marca } from '@/components/layout/marca'
import { Button, ButtonLink } from '@/components/ui/button'

/**
 * Pantalla de error de la app. Sin ella, un fallo del registro (Apps Script tarda
 * entre 3 y 7 segundos y a veces agota el tiempo de espera) muestra el error crudo
 * de Next, que en producción no explica nada y no ofrece reintentar.
 *
 * No usa PublicShell a propósito: ese contenedor llega hasta `servidor/entorno.ts`,
 * que es `server-only`, y desde un componente de cliente rompe la compilación.
 */
export default function ErrorDeAplicacion({
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
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-sidebar-border bg-sidebar">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4 sm:px-6">
          <Marca />
        </div>
        <div aria-hidden className="h-0.5 bg-primary" />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ServerCrash className="size-10 text-attention-accent" aria-hidden />
          <h1 className="text-page sm:text-page-lg">No pudimos cargar esta página</h1>
          <p className="max-w-md text-muted-foreground">
            El registro no respondió a tiempo. Vuelve a intentarlo en unos segundos. Si estabas
            firmando una constancia, no la envíes de nuevo sin confirmar con Infraestructura si
            quedó registrada.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <Button onClick={() => (retry ?? reset)()}>
              <RefreshCw aria-hidden />
              Reintentar
            </Button>
            <ButtonLink href="/" variante="secundario">
              Ir al inicio
            </ButtonLink>
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Código para soporte: <span className="tabular">{error.digest}</span>
            </p>
          )}
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Corporación Universitaria Americana · Infraestructura
      </footer>
    </div>
  )
}
