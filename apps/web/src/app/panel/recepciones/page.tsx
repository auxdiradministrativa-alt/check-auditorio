import { FileSignature, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/page-header'
import { EstadoBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EstadoVacio } from '@/components/ui/estado-vacio'
import { formatearFechaCorta, formatearFranja } from '@/lib/fechas'
import { registro } from '@/servidor/registro'

export const metadata: Metadata = { title: 'Recepciones' }

export default async function Recepciones() {
  const recepciones = (await registro('asignacion.listar', {}))
    .filter((a) => a.consecutivo)
    .sort((a, b) => (b.consecutivo ?? '').localeCompare(a.consecutivo ?? ''))
  return (
    <>
      <PageHeader
        antetitulo="Constancias"
        titulo="Recepciones"
        descripcion="Constancias firmadas. Cada una tiene un sello verificable."
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-pearl-200 text-xs tracking-wide text-ink-600 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">
                Consecutivo
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Evento
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Recibió
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Fecha
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                <span className="sr-only">Verificar</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pearl-200">
            {recepciones.length === 0 && (
              <tr>
                <td colSpan={6} className="p-0">
                  <EstadoVacio
                    icono={FileSignature}
                    titulo="Todavía no hay constancias"
                    descripcion="Cada recepción firmada queda aquí con su consecutivo y su sello verificable."
                  />
                </td>
              </tr>
            )}
            {recepciones.map((r) => (
              <tr key={r.id} className="hover:bg-pearl-100">
                <td className="px-6 py-4 font-semibold text-navy-900 tabular">{r.consecutivo}</td>
                <td className="px-3 py-4">
                  <Link
                    href={`/panel/asignaciones/${r.id}`}
                    className="font-medium text-navy-900 hover:underline"
                  >
                    {r.evento}
                  </Link>
                </td>
                <td className="px-3 py-4 text-ink-600">{r.receptor?.nombre}</td>
                <td className="px-3 py-4 text-ink-600 tabular">
                  {formatearFechaCorta(r.inicio)} · {formatearFranja(r.inicio, r.fin)}
                </td>
                <td className="px-3 py-4">
                  <EstadoBadge estado={r.estado} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/verificar/${r.consecutivo}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-navy-700 hover:text-navy-900"
                  >
                    <ShieldCheck className="size-4" aria-hidden />
                    Verificar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
