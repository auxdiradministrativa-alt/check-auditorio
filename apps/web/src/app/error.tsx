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
      <header className="bg-navy-900">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4 sm:px-6">
          <Marca />
        </div>
        <div aria-hidden className="h-0.5 bg-linear-to-r from-gold-600 via-gold-400 to-gold-600" />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ServerCrash className="size-10 text-gold-600" aria-hidden />
          <h1 className="text-page sm:text-page-lg">No pudimos cargar esta página</h1>
          <p className="max-w-md text-ink-600">
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
            <p className="text-xs text-ink-500">
              Código para soporte: <span className="tabular">{error.digest}</span>
            </p>
          )}
        </div>
      </main>
      <footer className="border-t border-pearl-200 py-6 text-center text-xs text-ink-600">
        Corporación Universitaria Americana · Infraestructura
      </footer>
    </div>
  )
}
