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
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 border-b border-pearl-200 pb-6 sm:mb-8">
      <div className="flex min-w-0 flex-[1_1_24rem] flex-col gap-2">
        {antetitulo && <p className="text-sm font-medium text-ink-600">{antetitulo}</p>}
        <h1 className="text-page text-navy-900 sm:text-page-lg">{titulo}</h1>
        {descripcion && <p className="max-w-prose text-sm text-ink-600">{descripcion}</p>}
      </div>
      {acciones && (
        <div className="flex max-w-full flex-wrap items-center gap-3 sm:self-center">
          {acciones}
        </div>
      )}
    </header>
  )
}
