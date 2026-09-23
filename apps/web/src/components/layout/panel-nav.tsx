'use client'

import { Command } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'

const SECCIONES = [
  { id: 'operacion', etiqueta: 'Operación' },
  { id: 'reservas', etiqueta: 'Reservas' },
  { id: 'historico', etiqueta: 'Histórico' },
] as const

type Seccion = (typeof SECCIONES)[number]['id']

/**
 * Navegación fija del centro de gestión. Marca la sección visible con `aria-current` usando
 * IntersectionObserver (sin escuchar el scroll): la franja observada es el tercio superior.
 */
export function PanelNav() {
  const [actual, setActual] = useState<Seccion | null>(null)

  useEffect(() => {
    const visibles = new Set<Seccion>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const id = e.target.id as Seccion
          if (e.isIntersecting) visibles.add(id)
          else visibles.delete(id)
        }
        setActual(SECCIONES.find((s) => visibles.has(s.id))?.id ?? null)
      },
      { rootMargin: '-72px 0px -66% 0px' },
    )
    for (const { id } of SECCIONES) {
      const el = document.getElementById(id)
      if (el) observador.observe(el)
    }
    return () => observador.disconnect()
  }, [])

  return (
    <nav
      data-nav-fija
      aria-label="Secciones de gestión"
      className="sticky top-0 z-20 border-b border-border bg-card"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-x-6 overflow-x-auto px-4 sm:px-6">
        <Link
          href="/panel"
          className="flex h-12 shrink-0 items-center gap-2 text-sm font-semibold text-foreground"
        >
          <Command className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Centro de gestión</span>
        </Link>
        <div className="flex gap-x-1 text-sm sm:gap-x-2">
          {SECCIONES.map(({ id, etiqueta }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={actual === id ? 'location' : undefined}
              className={cn(
                'flex h-12 shrink-0 items-center border-b-2 px-2 transition-colors',
                actual === id
                  ? 'border-attention-accent font-semibold text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {etiqueta}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
