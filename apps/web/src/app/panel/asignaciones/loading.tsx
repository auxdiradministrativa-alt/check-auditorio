import { Card } from '@/components/ui/card'
import { AvisoCargando, SkeletonFilas, SkeletonPageHeader } from '@/components/ui/skeleton'

export default function CargandoAsignaciones() {
  return (
    <>
      <AvisoCargando>Cargando las asignaciones…</AvisoCargando>
      <SkeletonPageHeader conAccion />
      <Card className="overflow-hidden">
        <SkeletonFilas filas={6} />
      </Card>
    </>
  )
}
