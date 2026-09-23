import { Card } from '@/components/ui/card'
import {
  AvisoCargando,
  Skeleton,
  SkeletonFilas,
  SkeletonPageHeader,
} from '@/components/ui/skeleton'

/** Carga de cualquier página del panel que no tenga la suya. */
export default function CargandoPanel() {
  return (
    <>
      <AvisoCargando>Cargando el centro de gestión…</AvisoCargando>
      <SkeletonPageHeader conAccion />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="px-5 py-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-12" />
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-4 sm:px-6">
          <Skeleton className="h-5 w-32" />
        </div>
        <SkeletonFilas />
      </Card>
    </>
  )
}
