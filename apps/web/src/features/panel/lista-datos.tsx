/** Par etiqueta–valor ya formateado en servidor (fechas en hora de Bogotá, sin desajuste al hidratar). */
export type DatoEntrega = { etiqueta: string; valor: string }

export function ListaDatos({ datos }: { datos: DatoEntrega[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {datos.map(({ etiqueta, valor }) => (
        <div key={etiqueta} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
          <dd className="font-medium break-words text-foreground">{valor || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
