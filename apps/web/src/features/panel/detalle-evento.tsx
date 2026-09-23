import { CalendarDays, Clock, ExternalLink, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import type { Asignacion, Espacio, ElementoCatalogo } from '@check-auditorio/shared'

import { EstadoBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BotonAnular } from '@/features/panel/boton-anular'
import { LineaTiempo } from '@/features/panel/linea-tiempo'
import { ResumenCatalogo } from '@/features/panel/resumen-catalogo'
import { TarjetaValidacion } from '@/features/panel/tarjeta-validacion'
import { formatearFechaLarga, formatearFranja } from '@/lib/fechas'
import { qrSvg } from '@/servidor/qr'
import { UtilidadesQr } from './utilidades-qr'
import { urlRecepcion } from '@/servidor/tokens'

/** Datos ya autorizados y leídos por el centro de gestión; no repite consultas remotas. */
export async function DetalleEvento({
  asignacion,
  espacios,
  elementos,
}: {
  asignacion: Asignacion
  espacios: Espacio[]
  elementos: ElementoCatalogo[]
}) {
  const espacio = espacios.find((e) => e.id === asignacion.espacioId)
  const catalogo = elementos.filter((e) => e.espacioId === asignacion.espacioId)
  const { id, evento, inicio, fin, estado, receptor, consecutivo, entregadoPor } = asignacion
  const muestraQr = estado === 'PROGRAMADA'
  const enlace = urlRecepcion(id)
  const svg = muestraQr ? await qrSvg(enlace) : null
  const anulable = ['PROGRAMADA', 'EN_VALIDACION', 'EN_DILIGENCIAMIENTO'].includes(estado)

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <EstadoBadge estado={estado} />
          {consecutivo && (
            <span className="text-sm font-semibold text-navy-700 tabular">{consecutivo}</span>
          )}
        </div>
        <h3 className="text-section">{evento}</h3>
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {estado === 'EN_VALIDACION' && receptor && (
            <TarjetaValidacion asignacionId={id} solicitante={receptor} />
          )}

          {estado === 'EN_DILIGENCIAMIENTO' && receptor && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">Diligenciando la constancia</CardTitle>
                <CardDescription>
                  {receptor.nombre} ({receptor.correo}) está revisando los elementos en su celular.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {svg && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">QR de recepción</CardTitle>
                <CardDescription>
                  Muéstralo a la persona que recibe. Es de un solo uso y funciona desde 30 minutos
                  antes del inicio hasta el fin del evento.
                </CardDescription>
              </CardHeader>
              <CardBody className="flex flex-wrap items-start gap-6">
                <div
                  role="img"
                  aria-label={`Código QR para recibir ${evento}`}
                  className="aspect-square w-full max-w-60 shrink-0 rounded-2xl border border-pearl-200 bg-white p-3 [&_svg]:size-full"
                  // SVG generado en servidor a partir de una URL propia.
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="flex min-w-0 flex-[1_1_14rem] flex-col gap-3 text-sm text-ink-600">
                  <ul className="flex flex-col gap-2">
                    <li>• Quien escanee debe iniciar sesión con su cuenta institucional.</li>
                    <li>• Tú confirmas su identidad antes de que diligencie la constancia.</li>
                    <li>• Si rechazas, el QR queda libre de nuevo.</li>
                  </ul>
                  <UtilidadesQr svg={svg} enlace={enlace} evento={evento} />
                  <a
                    href={enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold break-all text-navy-700 hover:text-navy-900"
                  >
                    <ExternalLink className="size-4 shrink-0" aria-hidden />
                    Abrir enlace de recepción
                  </a>
                </div>
              </CardBody>
            </Card>
          )}

          {consecutivo && receptor && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">Constancia de recepción</CardTitle>
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
              <CardTitle as="h4">Elementos del espacio</CardTitle>
            </CardHeader>
            <CardBody>
              <ResumenCatalogo catalogo={catalogo} />
            </CardBody>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle as="h4">Seguimiento</CardTitle>
            </CardHeader>
            <CardBody>
              <LineaTiempo estado={estado} />
            </CardBody>
          </Card>
          {anulable && <BotonAnular asignacionId={id} />}
        </div>
      </div>
    </>
  )
}
