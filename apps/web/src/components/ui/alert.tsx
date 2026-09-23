import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

const tonos = {
  info: 'border-accent bg-primary-soft text-primary-strong',
  oro: 'border-attention-accent/40 bg-attention-soft text-attention',
  ok: 'border-success/20 bg-success-soft text-success',
  peligro: 'border-destructive/20 bg-destructive-soft text-destructive-strong',
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
