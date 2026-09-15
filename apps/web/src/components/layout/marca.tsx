import Link from 'next/link'

import { cn } from '@/lib/cn'

/** Marca textual. Se reemplaza por el logo oficial cuando esté disponible. */
export function Marca({
  href = '/',
  claro = true,
  className,
}: {
  href?: string
  claro?: boolean
  className?: string
}) {
  return (
    <Link href={href} className={cn('group flex items-center gap-3', className)}>
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-lg border border-gold-500/60 font-display text-lg font-semibold text-gold-400"
      >
        A
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            'text-[0.8125rem] font-semibold tracking-wide',
            claro ? 'text-pearl-50' : 'text-navy-900',
          )}
        >
          Corporación Universitaria Americana
        </span>
        <span
          className={cn(
            'text-xs font-medium tracking-[0.14em] uppercase',
            claro ? 'text-gold-400' : 'text-gold-700',
          )}
        >
          Infraestructura
        </span>
      </span>
    </Link>
  )
}
