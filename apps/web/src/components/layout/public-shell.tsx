import type { ReactNode } from 'react'

import { AvisoDemo } from './aviso-demo'
import { Marca } from './marca'

/** Contenedor para quien recibe el espacio (flujo del QR, devolución, verificación). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AvisoDemo />
      <header className="bg-navy-900 print:hidden">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4 sm:px-6">
          <Marca />
        </div>
        <div aria-hidden className="h-0.5 bg-linear-to-r from-gold-600 via-gold-400 to-gold-600" />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-pearl-200 py-6 text-center text-xs text-ink-600 print:hidden">
        Corporación Universitaria Americana · Infraestructura
      </footer>
    </div>
  )
}
