import {
  CalendarDays,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  ShieldCheck,
  Undo2,
  UserRound,
} from 'lucide-react'
import type { Asignacion, Espacio, ElementoCatalogo } from '@check-auditorio/shared'
import { ETIQUETAS_ROL } from '@check-auditorio/shared'

import { Alert } from '@/components/ui/alert'
import { EstadoBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BotonAnular } from '@/features/panel/boton-anular'
import { LineaTiempo } from '@/features/panel/linea-tiempo'
import { ResumenCatalogo } from '@/features/panel/resumen-catalogo'
import {
  ListaDatos,
  TarjetaSolicitud,
  type DatoSolicitud,
} from '@/features/panel/tarjeta-solicitud'
import { TarjetaValidacion } from '@/features/panel/tarjeta-validacion'
import { formatearFechaHora, formatearFechaLarga, formatearFranja } from '@/lib/fechas'
import { qrSvg } from '@/servidor/qr'
import { UtilidadesQr } from './utilidades-qr'
import { urlRecepcion } from '@/servidor/tokens'

const ANULABLES = [
  'INVITADA',
  'SOLICITADA',
  'RECHAZADA',
  'PROGRAMADA',
  'EN_VALIDACION',
  'EN_DILIGENCIAMIENTO',
]

/** Lo que diligenció quien solicita, ya formateado en hora de Bogotá. */
function datosSolicitud(a: Asignacion, espacio: Espacio | undefined): DatoSolicitud[] {
  const s = a.solicitud
  return [
    { etiqueta: 'Evento', valor: a.evento },
    { etiqueta: 'Espacio', valor: espacio?.nombre ?? a.espacioId },
    { etiqueta: 'Fecha', valor: formatearFechaLarga(a.inicio) },
    { etiqueta: 'Franja', valor: formatearFranja(a.inicio, a.fin) },
    ...(s
      ? [
          { etiqueta: 'Rol', valor: ETIQUETAS_ROL[s.rol] },
          { etiqueta: 'Dependencia', valor: s.dependencia },
          { etiqueta: 'Cargo', valor: s.cargo },
          { etiqueta: 'Celular', valor: s.celular },
          { etiqueta: 'Asistentes estimados', valor: String(s.asistentesEstimados) },
        ]
      : []),
    ...(a.solicitadaEn ? [{ etiqueta: 'Enviada', valor: formatearFechaHora(a.solicitadaEn) }] : []),
  ]
}

/** Texto para pegar en WhatsApp o en un correo, con todo lo que la persona necesita saber. */
function mensajeInvitacion(a: Asignacion, correo: string, enlace: string) {
  const referencia = a.evento !== 'Por definir' ? ` para «${a.evento}»` : ''
  return [
    'Hola,',
    '',
    `Te comparto el enlace para solicitar el auditorio de la Corporación Universitaria Americana${referencia}. Allí registras el nombre del evento, la fecha, el horario y tus datos; Infraestructura revisa la solicitud y te confirma.`,
    '',
    `Entra con tu cuenta institucional ${correo}: el enlace solo funciona con esa cuenta.`,
    `El enlace vence el ${formatearFechaHora(a.tokenVence)}.`,
    '',
    enlace,
    '',
    'Infraestructura',
  ].join('\n')
}

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
  const {
    id,
    evento,
    inicio,
    fin,
    estado,
    receptor,
    consecutivo,
    entregadoPor,
    invitadoCorreo,
    solicitadaEn,
    motivoRechazo,
    tokenVence,
    recepcionDesde,
  } = asignacion
  const porEnlace = invitadoCorreo !== null
  // Una invitación aún no tiene franja: inicio = fin = hora de emisión.
  const sinFranja = estado === 'INVITADA'
  // En el flujo por enlace, el mismo enlace sirve para diligenciar, corregir y confirmar la recepción.
  const muestraQr = porEnlace
    ? ['INVITADA', 'RECHAZADA', 'PROGRAMADA'].includes(estado)
    : estado === 'PROGRAMADA'
  const enlace = urlRecepcion(id)
  const svg = muestraQr ? await qrSvg(enlace) : null
  const anulable = ANULABLES.includes(estado)
  const solicitante =
    receptor ?? (invitadoCorreo ? { nombre: invitadoCorreo, correo: invitadoCorreo } : null)

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <EstadoBadge estado={estado} />
          {consecutivo && (
            <span className="text-sm font-semibold text-primary-strong tabular">{consecutivo}</span>
          )}
        </div>
        <h3 className="text-section">{evento}</h3>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
            <dd className="first-letter:uppercase">
              {sinFranja ? 'Por definir' : formatearFechaLarga(inicio)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>
              <Clock className="size-4" aria-label="Horario" />
            </dt>
            <dd className="tabular">{sinFranja ? 'Por definir' : formatearFranja(inicio, fin)}</dd>
          </div>
          {invitadoCorreo && (
            <div className="flex min-w-0 items-center gap-1.5">
              <dt>
                <Mail className="size-4" aria-label="Solicitante" />
              </dt>
              <dd className="break-all">Para {invitadoCorreo}</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <dt>
              <UserRound className="size-4" aria-label={porEnlace ? 'Emitido por' : 'Entrega'} />
            </dt>
            <dd>
              {porEnlace ? 'Emitido por' : 'Entrega'} {entregadoPor.nombre}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {estado === 'SOLICITADA' && solicitante && solicitadaEn && (
            <TarjetaSolicitud
              asignacionId={id}
              version={solicitadaEn}
              solicitante={solicitante}
              datos={datosSolicitud(asignacion, espacio)}
            />
          )}

          {estado === 'RECHAZADA' && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">Devuelta para corregir</CardTitle>
                <CardDescription>
                  {solicitante?.nombre ?? 'Quien solicita'} verá este motivo al abrir su enlace.
                  Cuando corrija, la solicitud volverá a quedar por aprobar.
                </CardDescription>
              </CardHeader>
              <CardBody className="flex flex-col gap-5">
                <Alert tono="peligro" icono={<Undo2 aria-hidden />} titulo="Motivo">
                  {motivoRechazo || 'Sin motivo registrado.'}
                </Alert>
                <ListaDatos datos={datosSolicitud(asignacion, espacio)} />
              </CardBody>
            </Card>
          )}

          {estado === 'EN_VALIDACION' && receptor && (
            <TarjetaValidacion asignacionId={id} solicitante={receptor} />
          )}

          {estado === 'EN_DILIGENCIAMIENTO' && receptor && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">Diligenciando la constancia</CardTitle>
                <CardDescription>
                  {receptor.nombre} ({receptor.correo}) está revisando el estado del espacio en su
                  celular.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {svg && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">{porEnlace ? 'Enlace personal' : 'QR de recepción'}</CardTitle>
                <CardDescription>
                  {porEnlace
                    ? `Envíalo a ${invitadoCorreo} por WhatsApp, correo o el canal que uses. Solo esa cuenta puede abrirlo.`
                    : `Muéstralo a la persona que recibe. Es de un solo uso y funciona desde el ${formatearFechaHora(recepcionDesde)} hasta el fin del evento.`}
                </CardDescription>
              </CardHeader>
              <CardBody className="flex flex-wrap items-start gap-6">
                <div
                  role="img"
                  aria-label={
                    porEnlace
                      ? `Código QR del enlace para ${invitadoCorreo}`
                      : `Código QR para recibir ${evento}`
                  }
                  className="aspect-square w-full max-w-60 shrink-0 rounded-2xl border border-border bg-card p-3 [&_svg]:size-full"
                  // SVG generado en servidor a partir de una URL propia.
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="flex min-w-0 flex-[1_1_14rem] flex-col gap-3 text-sm text-muted-foreground">
                  {porEnlace ? (
                    <ul className="flex flex-col gap-2">
                      {estado === 'PROGRAMADA' ? (
                        <>
                          <li>• Con este mismo enlace confirma la recepción del espacio.</li>
                          <li>
                            • El botón se habilita el{' '}
                            <span className="tabular">{formatearFechaHora(recepcionDesde)}</span>.
                          </li>
                        </>
                      ) : (
                        <>
                          <li>• Quien solicita propone el evento, la fecha y el horario.</li>
                          <li>
                            • Vence el{' '}
                            <span className="tabular">{formatearFechaHora(tokenVence)}</span> si no
                            se {estado === 'RECHAZADA' ? 'corrige' : 'diligencia'}.
                          </li>
                          <li>• Tú apruebas o devuelves la solicitud desde este panel.</li>
                        </>
                      )}
                    </ul>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      <li>• Quien escanee debe iniciar sesión con su cuenta institucional.</li>
                      <li>• Tú confirmas su identidad antes de que diligencie la constancia.</li>
                      <li>• Si rechazas, el QR queda libre de nuevo.</li>
                    </ul>
                  )}
                  <UtilidadesQr
                    svg={svg}
                    enlace={enlace}
                    evento={evento}
                    {...(invitadoCorreo && estado !== 'PROGRAMADA'
                      ? { mensaje: mensajeInvitacion(asignacion, invitadoCorreo, enlace) }
                      : {})}
                  />
                  <p className="break-all text-foreground tabular">{enlace}</p>
                  <a
                    href={enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold break-all text-primary-strong hover:text-foreground"
                  >
                    <ExternalLink className="size-4 shrink-0" aria-hidden />
                    {porEnlace ? 'Abrir enlace' : 'Abrir enlace de recepción'}
                  </a>
                </div>
              </CardBody>
            </Card>
          )}

          {porEnlace && estado === 'PROGRAMADA' && asignacion.solicitud && (
            <Card>
              <CardHeader>
                <CardTitle as="h4">Solicitud aprobada</CardTitle>
              </CardHeader>
              <CardBody>
                <ListaDatos datos={datosSolicitud(asignacion, espacio)} />
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
              <CardTitle as="h4">Checklist del espacio</CardTitle>
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
              <LineaTiempo estado={estado} porEnlace={porEnlace} />
            </CardBody>
          </Card>
          {anulable && <BotonAnular asignacionId={id} />}
        </div>
      </div>
    </>
  )
}
