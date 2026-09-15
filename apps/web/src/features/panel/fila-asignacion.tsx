import { ChevronRight, Clock, UserRound } from 'lucide-react'
import Link from 'next/link'

import type { Asignacion } from '@check-auditorio/shared'

import { EstadoBadge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { formatearFechaCorta, formatearFranja } from '@/lib/fechas'

export function FilaAsignacion({
  asignacion,
  conFecha,
  compacta,
}: {
  asignacion: Asignacion
  conFecha?: boolean
  /** Para columnas angostas: oculta la columna de hora y la muestra como metadato. */
  compacta?: boolean
}) {
  const { id, evento, inicio, fin, estado, receptor, consecutivo } = asignacion
  return (
    <li>
      <Link
        href={`/panel/asignaciones/${id}`}
        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-pearl-100 sm:px-6"
      >
        <div className={cn('hidden w-28 shrink-0 flex-col', !compacta && 'sm:flex')}>
          <span className="text-sm font-semibold text-navy-900 tabular">
            {formatearFranja(inicio, fin).split(' – ')[0]}
          </span>
          <span className="text-xs text-ink-600 tabular">
            {conFecha
              ? formatearFechaCorta(inicio)
              : `a ${formatearFranja(inicio, fin).split(' – ')[1]}`}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('font-semibold text-navy-900', !compacta && 'truncate')}>
              {evento}
            </span>
            <EstadoBadge estado={estado} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
            <span className={cn('flex items-center gap-1.5', !compacta && 'sm:hidden')}>
              <Clock className="size-3.5" aria-hidden />
              <span className="tabular">
                {conFecha && `${formatearFechaCorta(inicio)} · `}
                {formatearFranja(inicio, fin)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <UserRound className="size-3.5" aria-hidden />
              {receptor ? receptor.nombre : 'Sin receptor aún'}
            </span>
            {consecutivo && (
              <span className="font-medium text-navy-700 tabular">{consecutivo}</span>
            )}
          </div>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-pearl-300 transition-colors group-hover:text-gold-600"
          aria-hidden
        />
      </Link>
    </li>
  )
}
