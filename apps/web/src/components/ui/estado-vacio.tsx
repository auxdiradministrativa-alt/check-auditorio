import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Estado vacío compuesto: icono, qué significa el vacío y qué hacer a continuación.
 * Una lista vacía con una sola línea de texto se lee como una pantalla sin terminar.
 */
export function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: LucideIcon
  titulo: ReactNode
  descripcion?: ReactNode
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-navy-50 text-navy-600">
        <Icono className="size-6" aria-hidden />
      </span>
      <p className="font-display text-lg font-semibold text-navy-900">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-ink-600">{descripcion}</p>}
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  )
}
