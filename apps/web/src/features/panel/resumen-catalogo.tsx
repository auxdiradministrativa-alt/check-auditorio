import type { ElementoCatalogo } from '@check-auditorio/shared'
import { CATEGORIAS_ELEMENTO, ETIQUETAS_CATEGORIA } from '@check-auditorio/shared'

export function ResumenCatalogo({ catalogo }: { catalogo: ElementoCatalogo[] }) {
  return (
    <div className="flex flex-col gap-5">
      {CATEGORIAS_ELEMENTO.map((categoria) => {
        const items = catalogo.filter((e) => e.categoria === categoria)
        if (!items.length) return null
        return (
          <div key={categoria} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink-600">{ETIQUETAS_CATEGORIA[categoria]}</p>
            <ul className="flex flex-wrap gap-2">
              {items.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-2 rounded-lg border border-pearl-200 bg-white px-2.5 py-1 text-sm text-navy-900"
                >
                  {e.nombre}
                  {categoria !== 'ESPACIO' && (
                    <span className="rounded bg-navy-50 px-1.5 text-xs font-semibold text-navy-700 tabular">
                      ×{e.cantidadEsperada}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
