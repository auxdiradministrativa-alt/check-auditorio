import { Card } from '@/components/ui/card'
import { AvisoCargando, Skeleton } from '@/components/ui/skeleton'

/** Detalle de una asignación: el QR es lo primero que se espera ver. */
export default function CargandoAsignacion() {
  return (
    <>
      <AvisoCargando>Cargando la entrega y su QR…</AvisoCargando>
      <div className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Card className="mb-6">
        <div className="flex flex-col gap-6 px-5 py-6 sm:flex-row sm:px-6">
          <Skeleton className="aspect-square w-full max-w-60 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 px-5 py-6 sm:px-6">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    </>
  )
}
