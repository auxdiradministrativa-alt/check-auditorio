import type { ReactNode } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { MOCK_USUARIO_INFRAESTRUCTURA } from '@/lib/mock/datos'

import { AvisoDemo } from './aviso-demo'
import { Marca } from './marca'
import { PanelNav } from './panel-nav'

/** Contenedor del panel de Infraestructura (quien entrega el espacio). */
export function PanelShell({ children }: { children: ReactNode }) {
  const usuario = MOCK_USUARIO_INFRAESTRUCTURA
  return (
    <div className="flex min-h-dvh flex-col">
      <AvisoDemo />
      <header className="bg-navy-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Marca href="/panel" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-pearl-50">{usuario.nombre}</p>
              <p className="text-xs text-navy-100/80">{usuario.correo}</p>
            </div>
            <Avatar nombre={usuario.nombre} className="size-9 bg-navy-700" />
          </div>
        </div>
        <div aria-hidden className="h-0.5 bg-linear-to-r from-gold-600 via-gold-400 to-gold-600" />
      </header>
      <PanelNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
