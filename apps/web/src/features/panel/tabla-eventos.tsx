'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, QrCode, ShieldCheck } from 'lucide-react'
import type { Asignacion, Espacio, EstadoAsignacion } from '@check-auditorio/shared'
import { EstadoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatearFechaCorta, formatearFranja } from '@/lib/fechas'

const POR_PAGINA = 10

type Campo = 'evento' | 'fecha' | 'estado'
type Orden = { campo: Campo; dir: 'asc' | 'desc' } | null

/** Orden del flujo, no alfabético: ordenar por estado agrupa lo que está en el mismo punto. */
const FLUJO: EstadoAsignacion[] = [
  'SOLICITADA',
  'EN_VALIDACION',
  'DEVOLUCION_VENCIDA',
  'EN_DILIGENCIAMIENTO',
  'RECHAZADA',
  'INVITADA',
  'PROGRAMADA',
  'RECIBIDA',
  'DEVUELTA',
  'EXPIRADA',
  'ANULADA',
]

const ACCION_POR_ESTADO: Partial<Record<EstadoAsignacion, string>> = {
  INVITADA: 'Ver registro',
  SOLICITADA: 'Ver registro',
  RECHAZADA: 'Ver motivo',
  PROGRAMADA: 'Abrir QR',
  EN_VALIDACION: 'Ver entrega',
}

const comparar: Record<Campo, (a: Asignacion, b: Asignacion) => number> = {
  evento: (a, b) => a.evento.localeCompare(b.evento, 'es', { sensitivity: 'base' }),
  fecha: (a, b) => a.inicio.localeCompare(b.inicio),
  estado: (a, b) => FLUJO.indexOf(a.estado) - FLUJO.indexOf(b.estado),
}

function Encabezado({
  campo,
  orden,
  onOrdenar,
  className,
  children,
}: {
  campo: Campo
  orden: Orden
  onOrdenar: (campo: Campo) => void
  className: string
  children: string
}) {
  const dir = orden?.campo === campo ? orden.dir : null
  const Icono = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown
  return (
    <th
      scope="col"
      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
      className={className}
    >
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className="-mx-1.5 inline-flex min-h-7 items-center gap-1 rounded px-1.5 py-1 font-medium transition-colors hover:bg-border/60 hover:text-foreground"
      >
        {children}
        <Icono
          className={dir ? 'size-3.5 text-primary-strong' : 'size-3.5 opacity-50'}
          aria-hidden
        />
      </button>
    </th>
  )
}

export function TablaEventos({
  datos,
  espacios,
  historial = false,
  pagina,
  setPagina,
  hayRegistros,
}: {
  datos: Asignacion[]
  espacios: Espacio[]
  historial?: boolean
  pagina: number
  setPagina: (pagina: number) => void
  hayRegistros: boolean
}) {
  function filas(datos: Asignacion[], historial = false) {
    return datos.map((a) => (
      <tr
        key={a.id}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-4 align-top hover:bg-primary-soft/60 md:table-row md:p-0"
      >
        <td className="col-span-2 min-w-0 [overflow-wrap:anywhere] break-words md:px-5 md:py-4">
          <Link
            href={`/panel?evento=${a.id}#operacion`}
            prefetch={false}
            className="font-semibold text-foreground hover:underline"
          >
            {a.evento}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {espacios.find((e) => e.id === a.espacioId)?.nombre ?? a.espacioId}
          </p>
          {historial ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {a.receptor?.nombre ?? a.invitadoCorreo ?? 'Sin receptor'}
            </p>
          ) : (
            a.invitadoCorreo &&
            !a.receptor && (
              <p className="mt-1 text-xs break-all text-muted-foreground">
                Para {a.invitadoCorreo}
              </p>
            )
          )}
        </td>
        <td className="text-sm tabular md:px-3 md:py-4">
          {a.estado === 'INVITADA' ? (
            <>
              <p>Por definir</p>
              <p className="mt-1 text-xs text-muted-foreground">La propone quien solicita</p>
            </>
          ) : (
            <>
              <p>{formatearFechaCorta(a.inicio)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatearFranja(a.inicio, a.fin)}
              </p>
            </>
          )}
        </td>
        <td className="text-right md:px-3 md:py-4 md:text-left">
          <EstadoBadge estado={a.estado} />
        </td>
        <td className="col-span-2 border-t border-border pt-3 md:border-0 md:px-5 md:py-4 md:text-right">
          {historial && a.consecutivo ? (
            <Link
              href={`/verificar/${a.consecutivo}`}
              prefetch={false}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline md:min-h-0"
            >
              <ShieldCheck className="size-4" aria-hidden />
              {a.consecutivo}
            </Link>
          ) : (
            <Link
              href={`/panel?evento=${a.id}#operacion`}
              prefetch={false}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline md:min-h-0"
            >
              {(a.estado === 'PROGRAMADA' || a.estado === 'INVITADA') && (
                <QrCode className="size-4" aria-hidden />
              )}
              {ACCION_POR_ESTADO[a.estado] ?? 'Gestionar'}
            </Link>
          )}
        </td>
      </tr>
    ))
  }

  const [orden, setOrden] = useState<Orden>(null)
  // Sin orden elegido se respeta el del centro: primero lo que requiere atención.
  const ordenados = orden
    ? [...datos].sort((a, b) => comparar[orden.campo](a, b) * (orden.dir === 'asc' ? 1 : -1))
    : datos

  // asc → desc → orden del centro.
  function ordenar(campo: Campo) {
    setOrden((previo) =>
      previo?.campo !== campo
        ? { campo, dir: 'asc' }
        : previo.dir === 'asc'
          ? { campo, dir: 'desc' }
          : null,
    )
    setPagina(1)
  }

  const numero = Math.min(pagina, Math.max(1, Math.ceil(datos.length / POR_PAGINA)))
  const setNumero = setPagina
  return (
    <>
      <div className="overflow-x-auto">
        <table className="block w-full text-left text-sm md:table md:min-w-[640px] md:table-fixed">
          <caption className="sr-only">
            {historial ? 'Registro histórico de eventos y recepciones' : 'Entregas activas'}
          </caption>
          <thead className="sr-only border-y border-border bg-background/60 text-xs text-muted-foreground focus-within:not-sr-only md:not-sr-only">
            <tr>
              <Encabezado
                campo="evento"
                orden={orden}
                onOrdenar={ordenar}
                className="px-5 py-2 font-medium md:w-[32%]"
              >
                Evento y espacio
              </Encabezado>
              <Encabezado
                campo="fecha"
                orden={orden}
                onOrdenar={ordenar}
                className="px-3 py-2 font-medium md:w-[24%]"
              >
                Fecha y horario
              </Encabezado>
              <Encabezado
                campo="estado"
                orden={orden}
                onOrdenar={ordenar}
                className="px-3 py-2 font-medium md:w-[26%]"
              >
                Estado
              </Encabezado>
              <th scope="col" className="px-5 py-3 text-right font-medium md:w-[18%]">
                {historial ? 'Constancia / gestión' : 'Operación'}
              </th>
            </tr>
          </thead>
          <tbody className="block divide-y divide-border md:table-row-group">
            {filas(ordenados.slice((numero - 1) * POR_PAGINA, numero * POR_PAGINA), historial)}
          </tbody>
        </table>
      </div>
      {!datos.length && (
        <div className="p-8 text-center">
          <p className="font-semibold">
            {hayRegistros ? 'No hay eventos que coincidan' : 'Aún no hay eventos registrados'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hayRegistros
              ? 'Revisa los filtros o consulta el registro histórico.'
              : 'Emite el primer enlace para que alguien solicite el espacio.'}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        {/* Sin role="status": el resumen de filtros anuncia una sola vez por cambio. */}
        <span>
          {datos.length} {datos.length === 1 ? 'evento' : 'eventos'} · Página {numero} de{' '}
          {Math.max(1, Math.ceil(datos.length / POR_PAGINA))}
        </span>
        <div className="flex gap-2">
          <Button
            variante="fantasma"
            tamano="sm"
            disabled={numero <= 1}
            onClick={() => setNumero(numero - 1)}
          >
            Anterior
          </Button>
          <Button
            variante="fantasma"
            tamano="sm"
            disabled={numero * POR_PAGINA >= datos.length}
            onClick={() => setNumero(numero + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </>
  )
}
