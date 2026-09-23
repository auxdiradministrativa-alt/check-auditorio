import { cn } from '@/lib/cn'

export function Stepper({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <nav aria-label="Progreso">
      <p className="mb-2 text-sm font-medium text-ink-600">
        Paso {actual + 1} de {pasos.length} · {pasos[actual]}
      </p>
      <ol className="flex gap-1.5">
        {pasos.map((paso, i) => (
          <li
            key={paso}
            aria-current={i === actual ? 'step' : undefined}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < actual && 'bg-navy-800',
              i === actual && 'bg-gold-500',
              i > actual && 'bg-pearl-300',
            )}
          >
            <span className="sr-only">
              {paso}
              {i < actual && ' (completado)'}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
