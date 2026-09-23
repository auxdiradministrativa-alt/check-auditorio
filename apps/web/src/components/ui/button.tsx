import Link from 'next/link'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const variantes = {
  primario:
    'bg-primary-strong text-primary-strong-foreground hover:bg-primary-strong-hover active:bg-primary-strong-hover',
  oro: 'bg-attention-accent text-foreground hover:bg-attention-accent/85 active:bg-attention-accent/75',
  secundario:
    'border border-border-strong/60 bg-card text-foreground hover:border-primary hover:bg-primary-soft',
  fantasma: 'text-primary-strong hover:bg-primary-soft',
  peligro:
    'border border-destructive/25 bg-destructive-soft text-destructive-strong hover:bg-destructive/15',
} as const

const tamanos = {
  sm: 'min-h-11 gap-2 py-2 sm:min-h-9 rounded-lg px-3 text-sm',
  md: 'min-h-11 gap-2 py-2.5 rounded-xl px-4 text-base',
  lg: 'min-h-13 gap-3 py-3 rounded-xl px-6 text-base',
} as const

type Estilo = {
  variante?: keyof typeof variantes
  tamano?: keyof typeof tamanos
  bloque?: boolean
}

const base =
  'inline-flex max-w-full select-none items-center justify-center text-center font-medium whitespace-normal transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0'

export function Button({
  variante = 'primario',
  tamano = 'md',
  bloque,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & Estilo) {
  return (
    <button
      type={type}
      className={cn(base, variantes[variante], tamanos[tamano], bloque && 'w-full', className)}
      {...props}
    />
  )
}

export function ButtonLink({
  variante = 'primario',
  tamano = 'md',
  bloque,
  className,
  ...props
}: ComponentProps<typeof Link> & Estilo) {
  return (
    <Link
      className={cn(base, variantes[variante], tamanos[tamano], bloque && 'w-full', className)}
      {...props}
    />
  )
}
