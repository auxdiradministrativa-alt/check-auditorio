import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-card border border-pearl-200 bg-pearl-50 shadow-card',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'flex min-w-0 flex-col gap-2 rounded-t-card border-b border-pearl-200 bg-pearl-75 p-4 last:rounded-b-card last:border-b-0 sm:p-6',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({
  as: Heading = 'h2',
  className,
  ...props
}: ComponentProps<'h2'> & { as?: 'h2' | 'h3' | 'h4' }) {
  return <Heading className={cn('text-card text-navy-900', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('max-w-prose text-sm text-ink-600', className)} {...props} />
}

export function CardBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 p-4 sm:p-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'footer'>) {
  return (
    <footer
      className={cn(
        'flex flex-wrap items-center justify-end gap-3 rounded-b-card border-t border-pearl-200 bg-pearl-75 px-4 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  )
}
