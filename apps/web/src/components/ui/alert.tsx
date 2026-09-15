import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

const tonos = {
  info: 'border-navy-100 bg-navy-50 text-navy-800',
  oro: 'border-gold-500/30 bg-gold-50 text-gold-800',
  ok: 'border-ok-700/20 bg-ok-50 text-ok-700',
  peligro: 'border-danger-700/20 bg-danger-50 text-danger-700',
} as const

export function Alert({
  tono = 'info',
  icono,
  titulo,
  children,
  className,
}: {
  tono?: keyof typeof tonos
  icono?: ReactNode
  titulo?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div role="status" className={cn('flex gap-3 rounded-xl border p-4', tonos[tono], className)}>
      {icono && <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icono}</span>}
      <div className="flex flex-col gap-1 text-sm">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  )
}
