import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export function Checkbox({
  id,
  children,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { id: string; children: ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border border-border-strong bg-card p-4 transition-colors hover:border-primary/40 has-checked:border-primary-strong has-checked:bg-primary-soft',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary-strong"
        {...props}
      />
      <span className="text-sm leading-relaxed text-foreground">{children}</span>
    </label>
  )
}
