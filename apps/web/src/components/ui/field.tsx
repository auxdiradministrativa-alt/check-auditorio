import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export function Field({
  id,
  label,
  hint,
  error,
  opcional,
  className,
  children,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string | undefined
  opcional?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {opcional && <span className="ml-1.5 font-normal text-muted-foreground">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

const control =
  'min-w-0 w-full rounded-xl border border-border-strong bg-card px-3.5 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:border-primary/40 focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none disabled:bg-background disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/15'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 resize-y py-2.5', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-11 appearance-auto pr-8', className)} {...props} />
}
