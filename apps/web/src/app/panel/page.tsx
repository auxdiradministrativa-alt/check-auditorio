import { AlarmClock, CalendarCheck, CheckCircle2, Plus, ScanLine, Users } from 'lucide-react'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EstadoVacio } from '@/components/ui/estado-vacio'
import { FilaAsignacion } from '@/features/panel/fila-asignacion'
import { Indicador } from '@/features/panel/indicador'
import { isoBogota } from '@check-auditorio/shared'

import { RefrescoAutomatico } from '@/components/refresco-automatico'
import { formatearFechaLarga } from '@/lib/fechas'
import { registro } from '@/servidor/registro'

export const metadata: Metadata = { title: 'Hoy' }

export default async function PanelHoy() {
  const HOY = isoBogota(new Date()).slice(0, 10)
  const asignaciones = await registro('asignacion.listar', {})
  const deHoy = asignaciones.filter((a) => a.inicio.startsWith(HOY))
  const pendientes = asignaciones.filter((a) => a.estado === 'DEVOLUCION_VENCIDA')

  const contar = (...estados: string[]) => deHoy.filter((a) => estados.includes(a.estado)).length

  return (
    <>
      {contar('EN_VALIDACION') > 0 && <RefrescoAutomatico />}
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
            <CardDescription>
              {deHoy.length === 1 ? '1 entrega para hoy.' : `${deHoy.length} entregas para hoy.`}
            </CardDescription>
          </CardHeader>
          {deHoy.length ? (
            <ul className="divide-y divide-pearl-200 border-t border-pearl-200">
              {deHoy.map((a) => (
                <FilaAsignacion key={a.id} asignacion={a} />
              ))}
            </ul>
          ) : (
            <div className="border-t border-pearl-200">
              <EstadoVacio
                icono={CalendarCheck}
                titulo="Sin entregas para hoy"
                descripcion="Cuando programes una entrega aparecerá aquí, junto con su QR y el estado de la devolución."
                accion={
                  <ButtonLink href="/panel/asignaciones/nueva" variante="secundario" tamano="sm">
                    <Plus aria-hidden />
                    Programar entrega
                  </ButtonLink>
                }
              />
            </div>
          )}
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
            <div className="flex items-center gap-3 border-t border-pearl-200 px-6 py-5">
              <CheckCircle2 className="size-5 shrink-0 text-ok-700" aria-hidden />
              <p className="text-sm text-ink-600">
                Todo al día. Ninguna devolución pasó de su plazo.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
