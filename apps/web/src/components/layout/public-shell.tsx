import type { ReactNode } from 'react'

import { AvisoDemo } from './aviso-demo'
import { Marca } from './marca'
import { SaltarContenido } from './saltar-contenido'

/** Contenedor para quien recibe el espacio (flujo del QR, devolución, verificación). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SaltarContenido />
      <AvisoDemo />
      <header className="border-b border-sidebar-border bg-sidebar print:hidden">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4 sm:px-6">
          <Marca />
        </div>
        <div aria-hidden className="h-0.5 bg-primary" />
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 focus:outline-none sm:px-6 sm:py-10"
      >
        {children}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground print:hidden">
        Corporación Universitaria Americana · Infraestructura
      </footer>
    </div>
  )
}
