import { Plus } from 'lucide-react'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilaAsignacion } from '@/features/panel/fila-asignacion'
import { registro } from '@/servidor/registro'

export const metadata: Metadata = { title: 'Asignaciones' }

export default async function Asignaciones() {
  const asignaciones = (await registro('asignacion.listar', {})).reverse()
  return (
    <>
      <PageHeader
        antetitulo="Infraestructura"
        titulo="Asignaciones"
        descripcion="Todas las entregas temporales programadas, en curso y cerradas."
        acciones={
          <ButtonLink href="/panel/asignaciones/nueva" variante="oro">
            <Plus aria-hidden />
            Programar entrega
          </ButtonLink>
        }
      />
      <Card className="overflow-hidden">
        {asignaciones.length ? (
          <ul className="divide-y divide-pearl-200">
            {asignaciones.map((a) => (
              <FilaAsignacion key={a.id} asignacion={a} conFecha />
            ))}
          </ul>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-ink-600">
            Aún no hay asignaciones. Programa la primera entrega.
          </p>
        )}
      </Card>
    </>
  )
}
