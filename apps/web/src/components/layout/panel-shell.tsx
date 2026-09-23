import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Persona } from '@check-auditorio/shared'

import { Avatar } from '@/components/ui/avatar'
import { cerrarSesion } from '@/features/auth/acciones'

import { AvisoDemo } from './aviso-demo'
import { Marca } from './marca'
import { PanelNav } from './panel-nav'

/** Contenedor del panel de Infraestructura (quien entrega el espacio). */
export function PanelShell({ usuario, children }: { usuario: Persona; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AvisoDemo />
      <header className="bg-navy-900">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Marca href="/panel" />
          <div className="flex items-center gap-3">
            <div className="hidden max-w-80 min-w-0 text-right md:block">
              <p className="text-sm font-medium break-words text-pearl-50">{usuario.nombre}</p>
              <p className="text-xs break-all text-navy-100">{usuario.correo}</p>
            </div>
            <Avatar nombre={usuario.nombre} className="size-9 bg-navy-700" />
            <form action={cerrarSesion}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="grid size-11 place-items-center rounded-lg text-navy-100 transition-colors hover:bg-navy-800 hover:text-pearl-50 focus-visible:outline-2 focus-visible:outline-gold-500"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
        <div aria-hidden className="h-0.5 bg-linear-to-r from-gold-600 via-gold-400 to-gold-600" />
      </header>
      <PanelNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
