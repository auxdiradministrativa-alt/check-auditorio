'use client'

import { CalendarDays, ClipboardCheck, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/cn'

const ENLACES = [
  { href: '/panel', etiqueta: 'Hoy', icono: LayoutDashboard, exacto: true },
  { href: '/panel/asignaciones', etiqueta: 'Asignaciones', icono: CalendarDays, exacto: false },
  { href: '/panel/recepciones', etiqueta: 'Recepciones', icono: ClipboardCheck, exacto: false },
] as const

export function PanelNav() {
  const ruta = usePathname()
  return (
    <nav aria-label="Panel" className="border-b border-pearl-200 bg-pearl-50">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
        {ENLACES.map(({ href, etiqueta, icono: Icono, exacto }) => {
          const activo = exacto ? ruta === href : ruta.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors',
                  activo
                    ? 'border-gold-500 text-navy-900'
                    : 'border-transparent text-ink-600 hover:text-navy-900',
                )}
              >
                <Icono className="size-4" aria-hidden />
                {etiqueta}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
