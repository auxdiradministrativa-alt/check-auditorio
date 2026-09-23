'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Download, UserRoundCheck } from 'lucide-react'
import { type Asignacion, type Espacio } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { formatearHoraExacta } from '@/lib/fechas'
import { Card, CardHeader } from '@/components/ui/card'
import { RefrescoAutomatico } from '@/components/refresco-automatico'
import { OperacionEventos } from './operacion-eventos'
import { TablaEventos } from './tabla-eventos'
import { exportarRegistro } from './exportar-registro'
import { FiltrosRegistro, FILTROS_VACIOS } from './filtros-registro'

const CERRADAS = new Set(['DEVUELTA', 'ANULADA', 'EXPIRADA'])
const ATENCION = new Set(['SOLICITADA', 'EN_VALIDACION', 'DEVOLUCION_VENCIDA'])
/** Estados que aún pueden cambiar sin que el gestor haga nada: justifican el refresco de ~30 s. */
const ABIERTOS = [
  'INVITADA',
  'SOLICITADA',
  'RECHAZADA',
  'PROGRAMADA',
  'EN_VALIDACION',
  'EN_DILIGENCIAMIENTO',
  'RECIBIDA',
  'DEVOLUCION_VENCIDA',
]
/** Evento abierto que espera a otra persona (diligenciar, corregir, escanear): refresco de ~4 s. */
const ESPERANDO = ['INVITADA', 'RECHAZADA', 'PROGRAMADA', 'EN_VALIDACION', 'EN_DILIGENCIAMIENTO']
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function CentroGestion({
  asignaciones,
  espacios,
  eventoId,
  nuevo,
  detalle,
  leidoEn,
}: {
  asignaciones: Asignacion[]
  espacios: Espacio[]
  eventoId: string | undefined
  nuevo: boolean
  detalle: ReactNode
  /** Momento en que el servidor leyó el registro; cambia con cada refresco. */
  leidoEn: string
}) {
  const router = useRouter()
  const [actualizando, actualizar] = useTransition()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const { busqueda, espacio, estado, desde, hasta } = filtros
  const [pagina, setPagina] = useState(1)
  const [paginaHistorico, setPaginaHistorico] = useState(1)
  const [soloAtencion, setSoloAtencion] = useState(false)
  const [soloConstancias, setSoloConstancias] = useState(false)

  const filtradas = useMemo(
    () =>
      asignaciones.filter((a) => {
        const texto = normalizar(
          `${a.evento} ${a.receptor?.nombre ?? ''} ${a.receptor?.correo ?? ''} ${a.invitadoCorreo ?? ''} ${a.consecutivo ?? ''}`,
        )
        const fecha = a.inicio.slice(0, 10)
        return (
          texto.includes(normalizar(busqueda)) &&
          (!espacio || a.espacioId === espacio) &&
          (!estado || a.estado === estado) &&
          (!desde || fecha >= desde) &&
          (!hasta || fecha <= hasta)
        )
      }),
    [asignaciones, busqueda, espacio, estado, desde, hasta],
  )

  const activas = filtradas
    .filter((a) => !CERRADAS.has(a.estado) && (!soloAtencion || ATENCION.has(a.estado)))
    .sort(
      (a, b) =>
        Number(ATENCION.has(b.estado)) - Number(ATENCION.has(a.estado)) ||
        a.inicio.localeCompare(b.inicio),
    )
  const historico = [...filtradas]
    .filter((a) => !soloConstancias || a.consecutivo)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))
  const pendientes = asignaciones.filter((a) => ATENCION.has(a.estado)).length
  const seguimiento = asignaciones.some((a) => ABIERTOS.includes(a.estado))

  // Solicitudes que esperan al gestor: por aprobar (flujo por enlace) o por validar (anterior).
  const porRevisar = asignaciones.filter(
    (a) => a.estado === 'SOLICITADA' || a.estado === 'EN_VALIDACION',
  )
  // Si el evento que espera ya está abierto, su tarjeta basta.
  const avisoValidacion = porRevisar.filter((a) => a.id !== eventoId)
  const primeraPorValidar = avisoValidacion[0]
  const activos =
    Object.values(filtros).filter(Boolean).length + Number(soloAtencion) + Number(soloConstancias)
  const resumen = `${activas.length} ${activas.length === 1 ? 'reserva activa' : 'reservas activas'} y ${historico.length} ${historico.length === 1 ? 'registro' : 'registros'} en el histórico coinciden.`

  function cambiarFiltro(cambiar: () => void) {
    cambiar()
    setPagina(1)
    setPaginaHistorico(1)
  }

  function limpiar() {
    cambiarFiltro(() => {
      setFiltros(FILTROS_VACIOS)
      setSoloAtencion(false)
      setSoloConstancias(false)
    })
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {seguimiento && (
        <RefrescoAutomatico
          ms={
            eventoId && asignaciones.some((a) => a.id === eventoId && ESPERANDO.includes(a.estado))
              ? 4000
              : 30_000
          }
        />
      )}
      {/* Región viva montada siempre: anuncia la llegada de una solicitud sin mover el foco. */}
      <div role="status" aria-atomic="true">
        {primeraPorValidar && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-attention-accent/50 bg-attention-soft p-4 ring-4 ring-attention-accent/10 sm:px-6">
            <p className="flex min-w-0 items-start gap-3 text-sm text-foreground">
              <UserRoundCheck className="mt-0.5 size-5 shrink-0 text-attention" aria-hidden />
              <span className="min-w-0 break-words">
                {avisoValidacion.length === 1 ? (
                  <>
                    <strong className="font-semibold">
                      {primeraPorValidar.receptor?.nombre ?? 'Una persona'}
                    </strong>{' '}
                    {primeraPorValidar.estado === 'SOLICITADA'
                      ? `envió la solicitud de «${primeraPorValidar.evento}» y espera tu aprobación.`
                      : `escaneó el QR de «${primeraPorValidar.evento}» y espera que confirmes su identidad.`}
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">{avisoValidacion.length} solicitudes</strong>{' '}
                    esperan tu revisión.
                  </>
                )}
              </span>
            </p>
            <Link
              href={`/panel?evento=${primeraPorValidar.id}#operacion`}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-lg bg-attention-accent px-4 text-sm font-semibold text-foreground transition-colors hover:bg-attention-accent/85 active:bg-attention-accent/75 sm:min-h-9"
            >
              {avisoValidacion.length === 1
                ? primeraPorValidar.estado === 'SOLICITADA'
                  ? 'Revisar ahora'
                  : 'Validar ahora'
                : 'Revisar la primera'}
            </Link>
          </div>
        )}
      </div>

      <OperacionEventos eventoId={eventoId} nuevo={nuevo} detalle={detalle} />

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 sm:p-6">
        <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[
            ['Reservas activas', asignaciones.filter((a) => !CERRADAS.has(a.estado)).length],
            ['Requieren atención', pendientes],
            ['Constancias firmadas', asignaciones.filter((a) => a.consecutivo).length],
            ['Eventos cerrados', asignaciones.filter((a) => CERRADAS.has(a.estado)).length],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex min-w-0 flex-col gap-2">
              <dt className="text-sm font-medium text-muted-foreground">{etiqueta}</dt>
              <dd
                className={`text-2xl font-semibold tabular ${etiqueta === 'Requieren atención' && pendientes ? 'text-destructive' : 'text-foreground'}`}
              >
                {valor}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-border pt-3 text-xs text-muted-foreground tabular">
          {actualizando
            ? 'Actualizando…'
            : `Actualizado a las ${formatearHoraExacta(leidoEn)}${seguimiento ? ' · se actualiza solo' : ''}`}
        </p>
      </div>

      <FiltrosRegistro
        filtros={filtros}
        espacios={espacios}
        actualizando={actualizando}
        activos={activos}
        resumen={resumen}
        onCambiar={(campo, valor) =>
          cambiarFiltro(() => setFiltros((previos) => ({ ...previos, [campo]: valor })))
        }
        onLimpiar={limpiar}
        onActualizar={() => actualizar(() => router.refresh())}
      />

      <Card id="reservas" aria-labelledby="titulo-reservas" className="scroll-mt-16">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="titulo-reservas" className="text-section">
              Reservas y seguimiento
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Eventos programados y entregas abiertas, sin limitarse a la fecha de hoy.
            </p>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soloAtencion}
              onChange={(e) => cambiarFiltro(() => setSoloAtencion(e.target.checked))}
              className="size-4 accent-primary-strong"
            />
            Solo requieren atención
          </label>
        </CardHeader>
        <TablaEventos
          datos={activas}
          espacios={espacios}
          pagina={pagina}
          setPagina={setPagina}
          hayRegistros={!!asignaciones.length}
        />
      </Card>

      <Card id="historico" aria-labelledby="titulo-historico" className="scroll-mt-16">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="titulo-historico" className="text-section">
              Registro histórico y constancias
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Todas las reservas, incluidas devoluciones, anulaciones y eventos expirados.
            </p>
          </div>
          <Button
            variante="secundario"
            tamano="sm"
            disabled={!historico.length}
            onClick={() => exportarRegistro(historico, espacios)}
          >
            <Download aria-hidden />
            Exportar CSV
          </Button>
        </CardHeader>
        <label className="mx-4 my-2 flex min-h-11 items-center gap-2 text-sm sm:mx-6">
          <input
            type="checkbox"
            className="size-4 accent-primary-strong"
            checked={soloConstancias}
            onChange={(e) => cambiarFiltro(() => setSoloConstancias(e.target.checked))}
          />
          Solo recepciones con constancia
        </label>
        <TablaEventos
          datos={historico}
          espacios={espacios}
          historial
          pagina={paginaHistorico}
          setPagina={setPaginaHistorico}
          hayRegistros={!!asignaciones.length}
        />
      </Card>
    </div>
  )
}
