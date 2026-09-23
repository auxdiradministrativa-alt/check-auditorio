import { ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ETIQUETAS_ROL } from '@check-auditorio/shared'

import { EstadoBadge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'
import { BotonImprimir } from '@/features/verificacion/boton-imprimir'
import { cn } from '@/lib/cn'
import { formatearFechaHora, formatearFechaLarga, formatearFranja } from '@/lib/fechas'
import { exigirSesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'

export const metadata: Metadata = { title: 'Verificar constancia' }

type Props = { params: Promise<{ consecutivo: string }> }

/** Recalcula el sello desde lo que hoy dice el registro: cualquier edición posterior la marca «Alterada». */
export default async function Verificar({ params }: Props) {
  const consecutivo = decodeURIComponent((await params).consecutivo)
  await exigirSesion(`/verificar/${consecutivo}`)
  const c = await registro('constancia.obtener', { consecutivo })
  if (!c) notFound()

  const { sello, asignacion, espacio, integra } = c
  const filas: [string, string][] = [
    ['Consecutivo', sello.consecutivo],
    ['Código', sello.codigoVerificacion],
    ['Evento', asignacion.evento],
    ['Espacio', `${espacio.nombre} · ${espacio.ubicacion}`],
    [
      'Fecha',
      `${formatearFechaLarga(asignacion.inicio)} · ${formatearFranja(asignacion.inicio, asignacion.fin)}`,
    ],
    ['Recibió', `${c.receptor.nombre} (${c.receptor.correo})`],
    [
      'Rol y dependencia',
      `${ETIQUETAS_ROL[c.rol]} · ${c.dependencia}${c.cargo ? ` · ${c.cargo}` : ''}`,
    ],
    ['Asistentes', String(c.asistentes)],
    ['Entregó', `${asignacion.entregadoPor.nombre} (${asignacion.entregadoPor.correo})`],
    ['Sellada', formatearFechaHora(sello.selladaEn)],
    ['Términos', c.terminosVersion],
    [
      'Devolución',
      c.devolucion
        ? `${c.devolucion.resultado === 'BUENAS_CONDICIONES' ? 'Buenas condiciones' : 'Con novedades'} · ${formatearFechaHora(c.devolucion.declaradaEn)}`
        : 'Pendiente',
    ],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn(
          'flex items-start gap-4 rounded-card border p-5',
          integra
            ? 'border-success/25 bg-success-soft'
            : 'border-destructive/25 bg-destructive-soft',
        )}
      >
        {integra ? (
          <ShieldCheck className="size-9 shrink-0 text-success" aria-hidden />
        ) : (
          <ShieldAlert className="size-9 shrink-0 text-destructive" aria-hidden />
        )}
        <div className="flex flex-col gap-1">
          <h1
            className={cn(
              'text-page sm:text-page-lg',
              integra ? 'text-success' : 'text-destructive',
            )}
          >
            {integra ? 'Constancia íntegra' : 'Constancia alterada'}
          </h1>
          <p className="text-sm text-foreground">
            {integra
              ? 'Los datos registrados coinciden con el sello generado al momento de la firma.'
              : 'Los datos actuales no coinciden con el sello original: el registro se modificó después de la firma.'}
          </p>
        </div>
      </div>

      <Card>
        <CardBody>
          <dl className="flex flex-col divide-y divide-border text-sm">
            <div className="grid gap-1 pb-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-muted-foreground">Estado</dt>
              <dd>
                <EstadoBadge estado={asignacion.estado} />
              </dd>
            </div>
            {filas.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="min-w-0 font-medium [overflow-wrap:anywhere] text-foreground first-letter:uppercase">
                  {v}
                </dd>
              </div>
            ))}
            <div className="grid gap-1 pt-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-muted-foreground">Sello SHA-256</dt>
              <dd className="font-mono text-xs break-all text-primary-strong">{sello.sha256}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado del espacio al recibirlo</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {c.detalle.map((d) => (
              <li key={d.elementoId} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{d.elementoNombre}</span>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      d.estado === 'CONFORME' ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {d.estado === 'CONFORME' ? 'Conforme' : 'Novedad'}
                  </span>
                </div>
                {d.observacion && <span className="text-muted-foreground">{d.observacion}</span>}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <BotonImprimir />
      </div>
    </div>
  )
}
