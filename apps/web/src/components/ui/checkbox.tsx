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
        'flex cursor-pointer items-start gap-3 rounded-xl border border-pearl-300 bg-white p-4 transition-colors hover:border-navy-500/40 has-checked:border-navy-700 has-checked:bg-navy-50',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-navy-800"
        {...props}
      />
      <span className="text-sm leading-relaxed text-navy-900">{children}</span>
    </label>
  )
}
