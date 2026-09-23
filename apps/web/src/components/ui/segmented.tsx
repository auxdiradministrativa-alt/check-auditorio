'use client'

import { cn } from '@/lib/cn'

type Opcion<T extends string> = {
  valor: T
  etiqueta: string
  tono?: 'navy' | 'ok' | 'peligro'
}

const activo = {
  navy: 'border-navy-800 bg-navy-900 text-pearl-50',
  ok: 'border-ok-700 bg-ok-50 text-ok-700',
  peligro: 'border-danger-700 bg-danger-50 text-danger-700',
} as const

/** Grupo de opciones excluyentes con semántica de radio. */
export function Segmented<T extends string>({
  nombre,
  etiqueta,
  opciones,
  valor,
  onCambio,
  className,
}: {
  nombre: string
  etiqueta: string
  opciones: readonly Opcion<T>[]
  valor: T | null
  onCambio: (valor: T) => void
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className={cn('flex flex-wrap gap-2', className)}>
      {opciones.map((op) => {
        const seleccionado = valor === op.valor
        return (
          <label
            key={op.valor}
            className={cn(
              'flex min-h-11 flex-[1_1_8rem] cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-500',
              seleccionado
                ? activo[op.tono ?? 'navy']
                : 'border-pearl-300 bg-white text-navy-800 hover:border-navy-500/40',
            )}
          >
            <input
              type="radio"
              name={nombre}
              value={op.valor}
              checked={seleccionado}
              onChange={() => onCambio(op.valor)}
              className="sr-only"
            />
            {op.etiqueta}
          </label>
        )
      })}
    </div>
  )
}
