import { Card } from '@/components/ui/card'
import { Skeleton, SkeletonPageHeader } from '@/components/ui/skeleton'

/**
 * Propio, y no el heredado de `/panel/asignaciones`: esta pantalla es un formulario,
 * no una lista, y un esqueleto de filas anunciaría algo que no va a llegar.
 */
export default function CargandoNuevaAsignacion() {
  return (
    <div role="status">
      <SkeletonPageHeader />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <div className="flex flex-col gap-5 px-5 py-6 sm:px-6">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="mt-1 h-13 w-full rounded-xl" />
          </div>
        </Card>
        <Card className="h-fit">
          <div className="flex flex-col gap-3 px-5 py-6 sm:px-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>
      <p className="sr-only">Cargando el formulario de programación…</p>
    </div>
  )
}
