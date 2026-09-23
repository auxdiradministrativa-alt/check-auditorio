import type { ElementoCatalogo } from '@check-auditorio/shared'

/** Aspectos de infraestructura que valida quien recibe, en el orden del catálogo. */
export function ResumenCatalogo({ catalogo }: { catalogo: ElementoCatalogo[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">Aspectos que se validan</p>
      <ul className="flex flex-wrap gap-2">
        {catalogo.map((e) => (
          <li
            key={e.id}
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-sm text-foreground"
          >
            {e.nombre}
          </li>
        ))}
      </ul>
    </div>
  )
}
