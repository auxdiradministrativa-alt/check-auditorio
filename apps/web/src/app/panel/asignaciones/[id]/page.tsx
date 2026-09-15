import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EstadoBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineaTiempo } from '@/features/panel/linea-tiempo'
import { ResumenCatalogo } from '@/features/panel/resumen-catalogo'
import { TarjetaValidacion } from '@/features/panel/tarjeta-validacion'
import { obtenerAsignacion, obtenerCatalogo, obtenerEspacio } from '@/lib/datos/repositorio'
import { formatearFechaLarga, formatearFranja } from '@/lib/fechas'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const asignacion = await obtenerAsignacion((await params).id)
  return { title: asignacion?.evento ?? 'Asignación' }
}

export default async function DetalleAsignacion({ params }: Props) {
  const asignacion = await obtenerAsignacion((await params).id)
  if (!asignacion) notFound()

  const [espacio, catalogo] = await Promise.all([
    obtenerEspacio(asignacion.espacioId),
    obtenerCatalogo(asignacion.espacioId),
  ])
  const { evento, inicio, fin, estado, receptor, consecutivo, entregadoPor } = asignacion
  const muestraQr = estado === 'PROGRAMADA' || estado === 'EN_VALIDACION'

  return (
    <>
      <Link
        href="/panel/asignaciones"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Asignaciones
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <EstadoBadge estado={estado} />
          {consecutivo && (
            <span className="text-sm font-semibold text-navy-700 tabular">{consecutivo}</span>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{evento}</h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
          <div className="flex items-center gap-1.5">
            <dt>
              <MapPin className="size-4" aria-label="Espacio" />
            </dt>
            <dd>
              {espacio?.nombre} · {espacio?.ubicacion}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <CalendarDays className="size-4" aria-label="Fecha" />
            </dt>
            <dd className="first-letter:uppercase">{formatearFechaLarga(inicio)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <Clock className="size-4" aria-label="Horario" />
            </dt>
            <dd className="tabular">{formatearFranja(inicio, fin)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <UserRound className="size-4" aria-label="Entrega" />
            </dt>
            <dd>Entrega {entregadoPor.nombre}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          {estado === 'EN_VALIDACION' && receptor && (
            <TarjetaValidacion solicitante={receptor} escaneadoA="1:52 p. m." />
          )}

          {muestraQr && (
            <Card>
              <CardHeader>
                <CardTitle>QR de recepción</CardTitle>
                <CardDescription>
                  Muéstralo a la persona que recibe. Es de un solo uso y vence al iniciar el evento.
                </CardDescription>
              </CardHeader>
              <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="grid aspect-square w-56 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-gold-500/50 bg-white">
                  <div className="flex flex-col items-center gap-2 px-6 text-center">
                    <QrCode className="size-12 text-navy-800" aria-hidden />
                    <span className="text-xs font-medium text-ink-600">
                      El QR real se genera en la fase 2 (mecanismo).
                    </span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-ink-600">
                  <li>• Quien escanee debe iniciar sesión con su cuenta institucional.</li>
                  <li>• Tú confirmas su identidad antes de que diligencie la constancia.</li>
                  <li>• Si rechazas, el QR queda libre de nuevo.</li>
                </ul>
              </CardBody>
            </Card>
          )}

          {consecutivo && receptor && (
            <Card>
              <CardHeader>
                <CardTitle>Constancia de recepción</CardTitle>
                <CardDescription>
                  Firmada por {receptor.nombre} ({receptor.correo}).
                </CardDescription>
              </CardHeader>
              <CardBody className="flex flex-wrap gap-3">
                <ButtonLink href={`/verificar/${consecutivo}`} variante="secundario">
                  <ShieldCheck aria-hidden />
                  Verificar constancia
                </ButtonLink>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Elementos del espacio</CardTitle>
            </CardHeader>
            <CardBody>
              <ResumenCatalogo catalogo={catalogo} />
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Seguimiento</CardTitle>
          </CardHeader>
          <CardBody>
            <LineaTiempo estado={estado} />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
