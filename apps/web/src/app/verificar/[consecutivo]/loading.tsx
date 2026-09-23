import { Skeleton } from '@/components/ui/skeleton'

/** La verificación recalcula el sello desde la hoja: tarda lo que tarde el registro. */
export default function CargandoVerificacion() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-24 w-full rounded-card" />
      <div className="overflow-hidden rounded-card border border-border bg-card">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-border px-6 py-4">
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-4 max-w-sm flex-1" />
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">Recalculando el sello…</p>
    </div>
  )
}
