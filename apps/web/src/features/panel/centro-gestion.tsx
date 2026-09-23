'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { type Asignacion, type Espacio, type ElementoCatalogo } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { RefrescoAutomatico } from '@/components/refresco-automatico'
import { OperacionEventos } from './operacion-eventos'
import { TablaEventos } from './tabla-eventos'
import { exportarRegistro } from './exportar-registro'
import { FiltrosRegistro, FILTROS_VACIOS } from './filtros-registro'

const CERRADAS = new Set(['DEVUELTA', 'ANULADA', 'EXPIRADA'])
const ATENCION = new Set(['EN_VALIDACION', 'DEVOLUCION_VENCIDA'])
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function CentroGestion({
  asignaciones,
  espacios,
  elementos,
  eventoId,
  nuevo,
  detalle,
}: {
  asignaciones: Asignacion[]
  espacios: Espacio[]
  elementos: ElementoCatalogo[]
  eventoId: string | undefined
  nuevo: boolean
  detalle: ReactNode
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
          `${a.evento} ${a.receptor?.nombre ?? ''} ${a.receptor?.correo ?? ''} ${a.consecutivo ?? ''}`,
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
  const seguimiento = asignaciones.some((a) =>
    [
      'PROGRAMADA',
      'EN_VALIDACION',
      'EN_DILIGENCIAMIENTO',
      'RECIBIDA',
      'DEVOLUCION_VENCIDA',
    ].includes(a.estado),
  )

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
            eventoId &&
            asignaciones.some(
              (a) =>
                a.id === eventoId &&
                ['PROGRAMADA', 'EN_VALIDACION', 'EN_DILIGENCIAMIENTO'].includes(a.estado),
            )
              ? 4000
              : 30_000
          }
        />
      )}
      <OperacionEventos
        espacios={espacios}
        elementos={elementos}
        eventoId={eventoId}
        nuevo={nuevo}
        detalle={detalle}
      />

      <dl className="grid grid-cols-2 gap-4 rounded-card border border-pearl-200 bg-white p-4 sm:gap-6 sm:p-6 lg:grid-cols-4">
        {[
          ['Reservas activas', asignaciones.filter((a) => !CERRADAS.has(a.estado)).length],
          ['Requieren atención', pendientes],
          ['Constancias firmadas', asignaciones.filter((a) => a.consecutivo).length],
          ['Eventos cerrados', asignaciones.filter((a) => CERRADAS.has(a.estado)).length],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex min-w-0 flex-col gap-2">
            <dt className="text-sm font-medium text-ink-600">{etiqueta}</dt>
            <dd
              className={`text-2xl font-semibold tabular ${etiqueta === 'Requieren atención' && pendientes ? 'text-danger-700' : 'text-navy-900'}`}
            >
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      <FiltrosRegistro
        filtros={filtros}
        espacios={espacios}
        actualizando={actualizando}
        onCambiar={(campo, valor) =>
          cambiarFiltro(() => setFiltros((previos) => ({ ...previos, [campo]: valor })))
        }
        onLimpiar={limpiar}
        onActualizar={() => actualizar(() => router.refresh())}
      />

      <Card id="reservas" aria-labelledby="titulo-reservas" className="scroll-mt-6">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="titulo-reservas" className="text-section">
              Reservas y seguimiento
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Eventos programados y entregas abiertas, sin limitarse a la fecha de hoy.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soloAtencion}
              onChange={(e) => cambiarFiltro(() => setSoloAtencion(e.target.checked))}
              className="size-4 accent-navy-900"
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

      <Card id="historico" aria-labelledby="titulo-historico" className="scroll-mt-6">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="titulo-historico" className="text-section">
              Registro histórico y constancias
            </h2>
            <p className="mt-1 text-sm text-ink-600">
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
        <label className="mx-4 my-4 flex items-center gap-2 text-sm sm:mx-6">
          <input
            type="checkbox"
            className="size-4 accent-navy-900"
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
