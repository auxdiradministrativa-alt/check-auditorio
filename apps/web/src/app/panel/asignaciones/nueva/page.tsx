import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormNuevaAsignacion } from '@/features/panel/form-nueva-asignacion'
import { ResumenCatalogo } from '@/features/panel/resumen-catalogo'
import { listarEspacios, obtenerCatalogo } from '@/lib/datos/repositorio'

export const metadata: Metadata = { title: 'Programar entrega' }

export default async function NuevaAsignacion() {
  const espacios = await listarEspacios()
  const catalogo = await obtenerCatalogo(espacios[0]?.id ?? '')

  return (
    <>
      <PageHeader
        antetitulo="Nueva asignación"
        titulo="Programar entrega"
        descripcion="Al programarla se genera el QR que escaneará la persona que recibe el espacio."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardBody>
            <FormNuevaAsignacion espacios={espacios} />
          </CardBody>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Se entregará</CardTitle>
            <CardDescription>
              Lista definida por Infraestructura. Quien recibe la verifica elemento por elemento.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <ResumenCatalogo catalogo={catalogo} />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
