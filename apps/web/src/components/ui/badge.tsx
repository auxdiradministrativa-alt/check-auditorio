import type { ComponentProps } from 'react'

import type { EstadoAsignacion } from '@check-auditorio/shared'
import { ETIQUETAS_ESTADO_ASIGNACION } from '@check-auditorio/shared'

import { cn } from '@/lib/cn'

const tonos = {
  neutro: 'bg-pearl-200 text-ink-600',
  navy: 'bg-navy-100 text-navy-800',
  oro: 'bg-gold-50 text-gold-800 ring-1 ring-gold-500/30',
  ok: 'bg-ok-50 text-ok-700',
  peligro: 'bg-danger-50 text-danger-700',
} as const

export type TonoBadge = keyof typeof tonos

export function Badge({
  tono = 'neutro',
  punto,
  className,
  children,
  ...props
}: ComponentProps<'span'> & { tono?: TonoBadge; punto?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tonos[tono],
        className,
      )}
      {...props}
    >
      {punto && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const TONO_POR_ESTADO: Record<EstadoAsignacion, TonoBadge> = {
  PROGRAMADA: 'navy',
  EN_VALIDACION: 'oro',
  EN_DILIGENCIAMIENTO: 'oro',
  RECIBIDA: 'ok',
  DEVUELTA: 'neutro',
  DEVOLUCION_VENCIDA: 'peligro',
  ANULADA: 'neutro',
  EXPIRADA: 'neutro',
}

export function EstadoBadge({ estado }: { estado: EstadoAsignacion }) {
  return (
    <Badge tono={TONO_POR_ESTADO[estado]} punto>
      {ETIQUETAS_ESTADO_ASIGNACION[estado]}
    </Badge>
  )
}
