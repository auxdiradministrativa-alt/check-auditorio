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
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-navy-900">
        {label}
        {opcional && <span className="ml-1.5 font-normal text-ink-500">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-ink-600">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

const control =
  'w-full rounded-xl border border-pearl-300 bg-white px-3.5 text-[0.9375rem] text-navy-900 placeholder:text-ink-500 transition-colors hover:border-navy-500/40 focus:border-navy-600 focus:ring-3 focus:ring-navy-600/15 focus:outline-none disabled:bg-pearl-100 disabled:text-ink-600 aria-invalid:border-danger-700 aria-invalid:ring-danger-700/15'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 resize-y py-2.5', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-11 appearance-auto pr-8', className)} {...props} />
}
