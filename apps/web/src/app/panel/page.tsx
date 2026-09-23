import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/layout/page-header'
import { SkeletonFilas } from '@/components/ui/skeleton'
import { CentroGestion } from '@/features/panel/centro-gestion'
import { DetalleEvento } from '@/features/panel/detalle-evento'
import { exigirAccesoPanel } from '@/servidor/auth/sesion'
import { listarAsignaciones, listarCatalogo } from '@/servidor/registro/lecturas'

export const metadata: Metadata = { title: 'Centro de gestión' }

type Consulta = Promise<{ evento?: string; nuevo?: string }>

async function Gestion({ searchParams }: { searchParams: Consulta }) {
  await exigirAccesoPanel()
  const [asignaciones, catalogo, consulta] = await Promise.all([
    listarAsignaciones(),
    listarCatalogo(),
    searchParams,
  ])
  const eventoId = typeof consulta.evento === 'string' ? consulta.evento : undefined
  const seleccionada = eventoId ? asignaciones.find((a) => a.id === eventoId) : undefined
  if (eventoId && !seleccionada) notFound()
  return (
    <CentroGestion
      asignaciones={asignaciones}
      espacios={catalogo.espacios}
      eventoId={eventoId}
      nuevo={consulta.nuevo === '1'}
      leidoEn={new Date().toISOString()}
      detalle={
        seleccionada ? (
          <Suspense
            key={eventoId}
            fallback={
              <div role="status" className="p-6">
                Cargando la operación del evento…
                <SkeletonFilas />
              </div>
            }
          >
            <DetalleEvento
              asignacion={seleccionada}
              espacios={catalogo.espacios}
              elementos={catalogo.elementos}
            />
          </Suspense>
        ) : null
      }
    />
  )
}

export default function Panel({ searchParams }: { searchParams: Consulta }) {
  return (
    <>
      <PageHeader
        titulo="Gestión de espacios"
        descripcion="Emite enlaces de solicitud, aprueba reservas y controla cada una hasta su devolución. Todo el registro en un solo lugar."
      />
      <Suspense
        fallback={
          <div role="status" className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-card-title">Preparando el centro de gestión</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Consultando reservas y espacios disponibles…
            </p>
            <SkeletonFilas />
          </div>
        }
      >
        <Gestion searchParams={searchParams} />
      </Suspense>
    </>
  )
}
