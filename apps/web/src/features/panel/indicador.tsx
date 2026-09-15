import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'

export function Indicador({
  etiqueta,
  valor,
  icono: Icono,
  destacado,
}: {
  etiqueta: string
  valor: number
  icono: LucideIcon
  destacado?: 'oro' | 'peligro'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-card border bg-pearl-50 p-5 shadow-card',
        destacado === 'oro' && 'border-gold-500/40',
        destacado === 'peligro' && 'border-danger-700/30',
        !destacado && 'border-pearl-200',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-600">{etiqueta}</span>
        <Icono
          className={cn(
            'size-4',
            destacado === 'oro' && 'text-gold-600',
            destacado === 'peligro' && 'text-danger-700',
            !destacado && 'text-navy-500',
          )}
          aria-hidden
        />
      </div>
      <span className="font-display text-4xl font-semibold text-navy-900 tabular">{valor}</span>
    </div>
  )
}
