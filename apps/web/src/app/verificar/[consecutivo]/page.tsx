import { ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Card, CardBody } from '@/components/ui/card'
import { BotonImprimir } from '@/features/verificacion/boton-imprimir'
import { obtenerAsignacionPorConsecutivo, obtenerEspacio } from '@/lib/datos/repositorio'
import { cn } from '@/lib/cn'
import { formatearFechaHora, formatearFechaLarga, formatearFranja } from '@/lib/fechas'

export const metadata: Metadata = { title: 'Verificar constancia' }

type Props = { params: Promise<{ consecutivo: string }> }

// Ejemplo: REC-000122 simula una constancia alterada en el Sheet.
const HASH_EJEMPLO = '9f2c4e81b7d05a3c6e19f4b2d8a07c55e3b91d64a2f08c7e5b13d9a4c6f2e801'

export default async function Verificar({ params }: Props) {
  const { consecutivo } = await params
  const asignacion = await obtenerAsignacionPorConsecutivo(decodeURIComponent(consecutivo))
  if (!asignacion?.receptor) notFound()
  const espacio = await obtenerEspacio(asignacion.espacioId)
  const integra = asignacion.consecutivo !== 'REC-000122'

  const filas: [string, string][] = [
    ['Consecutivo', asignacion.consecutivo ?? ''],
    ['Evento', asignacion.evento],
    ['Espacio', `${espacio?.nombre} · ${espacio?.ubicacion}`],
    [
      'Fecha',
      `${formatearFechaLarga(asignacion.inicio)} · ${formatearFranja(asignacion.inicio, asignacion.fin)}`,
    ],
    ['Recibió', `${asignacion.receptor.nombre} (${asignacion.receptor.correo})`],
    ['Entregó', `${asignacion.entregadoPor.nombre} (${asignacion.entregadoPor.correo})`],
    ['Sellada', formatearFechaHora('2026-09-15T07:52:31-05:00')],
    ['Términos', 'v0.1-borrador'],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          'flex items-start gap-4 rounded-card border p-5',
          integra ? 'border-ok-700/25 bg-ok-50' : 'border-danger-700/25 bg-danger-50',
        )}
      >
        {integra ? (
          <ShieldCheck className="size-9 shrink-0 text-ok-700" aria-hidden />
        ) : (
          <ShieldAlert className="size-9 shrink-0 text-danger-700" aria-hidden />
        )}
        <div className="flex flex-col gap-1">
          <h1
            className={cn(
              'font-display text-2xl font-semibold',
              integra ? 'text-ok-700' : 'text-danger-700',
            )}
          >
            {integra ? 'Constancia íntegra' : 'Constancia alterada'}
          </h1>
          <p className="text-sm text-navy-900">
            {integra
              ? 'Los datos registrados coinciden con el sello generado al momento de la firma.'
              : 'Los datos actuales no coinciden con el sello original. Alguien modificó el registro después de la firma. Infraestructura fue notificada.'}
          </p>
        </div>
      </div>

      <Card>
        <CardBody>
          <dl className="flex flex-col divide-y divide-pearl-200 text-sm">
            {filas.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="text-ink-600">{k}</dt>
                <dd className="font-medium text-navy-900 first-letter:uppercase">{v}</dd>
              </div>
            ))}
            <div className="grid gap-1 pt-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="text-ink-600">Sello SHA-256</dt>
              <dd className="font-mono text-xs break-all text-navy-800">{HASH_EJEMPLO}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <BotonImprimir />
      </div>
    </div>
  )
}
