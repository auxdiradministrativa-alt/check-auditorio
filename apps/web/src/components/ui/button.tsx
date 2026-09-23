import Link from 'next/link'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const variantes = {
  primario: 'bg-navy-900 text-pearl-50 hover:bg-navy-800 active:bg-navy-950',
  oro: 'bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600',
  secundario:
    'border border-pearl-300 bg-pearl-50 text-navy-900 hover:border-navy-500/40 hover:bg-white',
  fantasma: 'text-navy-800 hover:bg-navy-50',
  peligro: 'border border-danger-700/25 bg-danger-50 text-danger-700 hover:bg-danger-700/10',
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
