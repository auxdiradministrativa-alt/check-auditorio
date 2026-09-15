import type { ReactNode } from 'react'

export function PageHeader({
  antetitulo,
  titulo,
  descripcion,
  acciones,
}: {
  antetitulo?: ReactNode
  titulo: ReactNode
  descripcion?: ReactNode
  acciones?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        {antetitulo && (
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            {antetitulo}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
          {titulo}
        </h1>
        {descripcion && <p className="max-w-2xl text-[0.9375rem] text-ink-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}
