import { CalendarRange, Plus } from 'lucide-react'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EstadoVacio } from '@/components/ui/estado-vacio'
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
          <EstadoVacio
            icono={CalendarRange}
            titulo="Todavía no hay asignaciones"
            descripcion="Programa una entrega para generar su QR. Aquí quedará el historial completo: programadas, en curso y cerradas."
            accion={
              <ButtonLink href="/panel/asignaciones/nueva" variante="oro" tamano="sm">
                <Plus aria-hidden />
                Programar la primera
              </ButtonLink>
            }
          />
        )}
      </Card>
    </>
  )
}
