import { cn } from '@/lib/cn'
import { iniciales } from '@/lib/iniciales'

export function Avatar({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full bg-navy-900 text-sm font-semibold text-gold-400',
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  )
}
