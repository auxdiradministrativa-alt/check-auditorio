'use client'

import Link from 'next/link'
import { QrCode, ShieldCheck } from 'lucide-react'
import type { Asignacion, Espacio } from '@check-auditorio/shared'
import { EstadoBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatearFechaCorta, formatearFranja } from '@/lib/fechas'

const POR_PAGINA = 10

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
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-4 align-top hover:bg-navy-50/60 md:table-row md:p-0"
      >
        <td className="col-span-2 min-w-0 [overflow-wrap:anywhere] break-words md:px-5 md:py-4">
          <Link
            href={`/panel?evento=${a.id}#operacion`}
            prefetch={false}
            className="font-semibold text-navy-900 hover:underline"
          >
            {a.evento}
          </Link>
          <p className="mt-1 text-xs text-ink-600">
            {espacios.find((e) => e.id === a.espacioId)?.nombre ?? a.espacioId}
          </p>
          {historial && (
            <p className="mt-1 text-xs text-ink-600">{a.receptor?.nombre ?? 'Sin receptor'}</p>
          )}
        </td>
        <td className="text-sm tabular md:px-3 md:py-4">
          <p>{formatearFechaCorta(a.inicio)}</p>
          <p className="mt-1 text-xs text-ink-600">{formatearFranja(a.inicio, a.fin)}</p>
        </td>
        <td className="text-right md:px-3 md:py-4 md:text-left">
          <EstadoBadge estado={a.estado} />
        </td>
        <td className="col-span-2 border-t border-pearl-200 pt-3 md:border-0 md:px-5 md:py-4 md:text-right">
          {historial && a.consecutivo ? (
            <Link
              href={`/verificar/${a.consecutivo}`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
            >
              <ShieldCheck className="size-4" aria-hidden />
              {a.consecutivo}
            </Link>
          ) : (
            <Link
              href={`/panel?evento=${a.id}#operacion`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
            >
              {a.estado === 'PROGRAMADA' && <QrCode className="size-4" aria-hidden />}
              {a.estado === 'PROGRAMADA'
                ? 'Abrir QR'
                : a.estado === 'EN_VALIDACION'
                  ? 'Validar identidad'
                  : 'Gestionar'}
            </Link>
          )}
        </td>
      </tr>
    ))
  }

  const numero = Math.min(pagina, Math.max(1, Math.ceil(datos.length / POR_PAGINA)))
  const setNumero = setPagina
  return (
    <>
      <div className="overflow-x-auto">
        <table className="block w-full text-left text-sm md:table md:min-w-[640px] md:table-fixed">
          <caption className="sr-only">
            {historial ? 'Registro histórico de eventos y recepciones' : 'Reservas activas'}
          </caption>
          <thead className="sr-only border-y border-pearl-200 bg-pearl-100/60 text-xs text-ink-600 md:not-sr-only">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium md:w-[32%]">
                Evento y espacio
              </th>
              <th scope="col" className="px-3 py-3 font-medium md:w-[24%]">
                Fecha y horario
              </th>
              <th scope="col" className="px-3 py-3 font-medium md:w-[26%]">
                Estado
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium md:w-[18%]">
                {historial ? 'Constancia / gestión' : 'Operación'}
              </th>
            </tr>
          </thead>
          <tbody className="block divide-y divide-pearl-200 md:table-row-group">
            {filas(datos.slice((numero - 1) * POR_PAGINA, numero * POR_PAGINA), historial)}
          </tbody>
        </table>
      </div>
      {!datos.length && (
        <div className="p-8 text-center">
          <p className="font-semibold">
            {hayRegistros ? 'No hay eventos que coincidan' : 'Aún no hay eventos registrados'}
          </p>
          <p className="mt-1 text-sm text-ink-600">
            {hayRegistros
              ? 'Revisa los filtros o consulta el registro histórico.'
              : 'Crea el primer evento para reservar el espacio y generar su QR.'}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pearl-200 px-5 py-3 text-xs text-ink-600">
        <span role="status">
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
