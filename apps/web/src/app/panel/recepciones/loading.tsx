import { Card } from '@/components/ui/card'
import { AvisoCargando, SkeletonFilas, SkeletonPageHeader } from '@/components/ui/skeleton'

export default function CargandoRecepciones() {
  return (
    <>
      <AvisoCargando>Cargando las constancias…</AvisoCargando>
      <SkeletonPageHeader />
      <Card className="overflow-hidden">
        <SkeletonFilas filas={5} />
      </Card>
    </>
  )
}
