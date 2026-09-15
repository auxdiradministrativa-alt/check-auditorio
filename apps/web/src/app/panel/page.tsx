import { AlarmClock, CalendarCheck, Plus, ScanLine, Users } from 'lucide-react'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FilaAsignacion } from '@/features/panel/fila-asignacion'
import { Indicador } from '@/features/panel/indicador'
import { listarAsignaciones } from '@/lib/datos/repositorio'
import { formatearFechaLarga } from '@/lib/fechas'

export const metadata: Metadata = { title: 'Hoy' }

// Fecha fija mientras la interfaz usa datos de ejemplo.
const HOY = '2026-09-15'

export default async function PanelHoy() {
  const asignaciones = await listarAsignaciones()
  const deHoy = asignaciones.filter((a) => a.inicio.startsWith(HOY))
  const pendientes = asignaciones.filter((a) => a.estado === 'DEVOLUCION_VENCIDA')

  const contar = (...estados: string[]) => deHoy.filter((a) => estados.includes(a.estado)).length

  return (
    <>
      <PageHeader
        antetitulo={formatearFechaLarga(`${HOY}T12:00:00-05:00`)}
        titulo="Entregas de hoy"
        descripcion="Programa entregas, valida la identidad de quien recibe y haz seguimiento a las devoluciones."
        acciones={
          <ButtonLink href="/panel/asignaciones/nueva" variante="oro">
            <Plus aria-hidden />
            Programar entrega
          </ButtonLink>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Indicador etiqueta="Programadas" valor={contar('PROGRAMADA')} icono={CalendarCheck} />
        <Indicador
          etiqueta="Por validar"
          valor={contar('EN_VALIDACION')}
          icono={ScanLine}
          destacado={contar('EN_VALIDACION') ? 'oro' : undefined}
        />
        <Indicador etiqueta="Recibidas" valor={contar('RECIBIDA', 'DEVUELTA')} icono={Users} />
        <Indicador
          etiqueta="Devoluciones vencidas"
          valor={pendientes.length}
          icono={AlarmClock}
          destacado={pendientes.length ? 'peligro' : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Agenda</CardTitle>
            <CardDescription>{deHoy.length} entregas programadas para hoy.</CardDescription>
          </CardHeader>
          <ul className="divide-y divide-pearl-200 border-t border-pearl-200">
            {deHoy.map((a) => (
              <FilaAsignacion key={a.id} asignacion={a} />
            ))}
          </ul>
        </Card>

        <Card className="h-fit overflow-hidden border-danger-700/20">
          <CardHeader className="pb-4">
            <CardTitle>Requieren atención</CardTitle>
            <CardDescription>Devoluciones que no se declararon a tiempo.</CardDescription>
          </CardHeader>
          {pendientes.length ? (
            <ul className="divide-y divide-pearl-200 border-t border-pearl-200">
              {pendientes.map((a) => (
                <FilaAsignacion key={a.id} asignacion={a} conFecha compacta />
              ))}
            </ul>
          ) : (
            <p className="border-t border-pearl-200 px-6 py-5 text-sm text-ink-600">Todo al día.</p>
          )}
        </Card>
      </div>
    </>
  )
}
