import { Command } from 'lucide-react'
import Link from 'next/link'

export function PanelNav() {
  return (
    <nav aria-label="Secciones de gestión" className="border-b border-pearl-200 bg-pearl-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-0 px-4 sm:px-6">
        <Link
          href="/panel"
          className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-gold-500 text-sm font-semibold text-navy-900"
        >
          <Command className="size-4" aria-hidden />
          Centro de gestión
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-0 text-sm text-ink-600">
          <a className="py-3 hover:text-navy-900" href="#operacion">
            Operación
          </a>
          <a className="py-3 hover:text-navy-900" href="#reservas">
            Reservas
          </a>
          <a className="py-3 hover:text-navy-900" href="#historico">
            Histórico
          </a>
        </div>
      </div>
    </nav>
  )
}
