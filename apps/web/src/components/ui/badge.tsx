import type { ComponentProps } from 'react'

import type { EstadoAsignacion } from '@check-auditorio/shared'
import { ETIQUETAS_ESTADO_ASIGNACION } from '@check-auditorio/shared'

import { cn } from '@/lib/cn'

const tonos = {
  neutro: 'bg-muted text-foreground',
  primario: 'bg-primary-soft text-primary-strong',
  oro: 'bg-attention-soft text-attention ring-1 ring-attention-accent/40',
  ok: 'bg-success-soft text-success',
  peligro: 'bg-destructive-soft text-destructive-strong',
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
  // Espera a quien solicita: en marcha, sin acción de Infraestructura.
  INVITADA: 'primario',
  // Espera la decisión de Infraestructura: atención.
  SOLICITADA: 'oro',
  // Devuelta con un motivo: destructivo suave, distinto de lo que espera al gestor.
  RECHAZADA: 'peligro',
  PROGRAMADA: 'primario',
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
