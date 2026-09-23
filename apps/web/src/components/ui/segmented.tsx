'use client'

import { cn } from '@/lib/cn'

type Opcion<T extends string> = {
  valor: T
  etiqueta: string
  tono?: 'primario' | 'ok' | 'peligro'
}

const activo = {
  primario: 'border-primary-strong bg-primary-strong text-primary-strong-foreground',
  ok: 'border-success bg-success-soft text-success',
  peligro: 'border-destructive bg-destructive-soft text-destructive-strong',
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
              'flex min-h-11 flex-[1_1_8rem] cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
              seleccionado
                ? activo[op.tono ?? 'primario']
                : 'border-border-strong bg-card text-primary-strong hover:border-primary/40',
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
