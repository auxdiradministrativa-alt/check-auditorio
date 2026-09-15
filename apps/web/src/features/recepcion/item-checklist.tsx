'use client'

import { Minus, Plus } from 'lucide-react'

import type { ElementoCatalogo, EstadoElemento } from '@check-auditorio/shared'
import { LIMITES } from '@check-auditorio/shared'

import { Segmented } from '@/components/ui/segmented'
import { Textarea } from '@/components/ui/field'
import { cn } from '@/lib/cn'

import { SelectorFotos } from './selector-fotos'
import type { ErroresItem, ItemEstado } from './tipos'

const OPCIONES = [
  { valor: 'CONFORME', etiqueta: 'Conforme', tono: 'ok' },
  { valor: 'NOVEDAD', etiqueta: 'Novedad', tono: 'peligro' },
] as const satisfies readonly { valor: EstadoElemento; etiqueta: string; tono: 'ok' | 'peligro' }[]

export function ItemChecklist({
  elemento,
  valor,
  errores,
  onCambio,
}: {
  elemento: ElementoCatalogo
  valor: ItemEstado
  errores?: ErroresItem | undefined
  onCambio: (valor: ItemEstado) => void
}) {
  const cuantificable = elemento.categoria !== 'ESPACIO'
  const set = (parcial: Partial<ItemEstado>) => onCambio({ ...valor, ...parcial })
  const idObs = `obs-${elemento.id}`

  return (
    <li
      id={`item-${elemento.id}`}
      className={cn(
        'flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-white p-4 transition-colors',
        valor.estado === 'NOVEDAD' ? 'border-danger-700/30' : 'border-pearl-200',
        errores?.estado && 'border-danger-700/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-navy-900">{elemento.nombre}</span>
          {cuantificable && (
            <span className="text-sm text-ink-600">
              Se entregan{' '}
              <strong className="text-navy-900 tabular">{elemento.cantidadEsperada}</strong>
            </span>
          )}
        </div>
        {cuantificable && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-medium text-ink-600" id={`cant-${elemento.id}`}>
              Recibes
            </span>
            <div
              className="flex items-center rounded-lg border border-pearl-300"
              role="group"
              aria-labelledby={`cant-${elemento.id}`}
            >
              <button
                type="button"
                className="grid size-9 place-items-center text-navy-800 disabled:text-pearl-300"
                onClick={() => set({ cantidadRecibida: Math.max(0, valor.cantidadRecibida - 1) })}
                disabled={valor.cantidadRecibida <= 0}
                aria-label="Restar uno"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <input
                inputMode="numeric"
                aria-label={`Cantidad recibida de ${elemento.nombre}`}
                className="h-9 w-12 border-x border-pearl-300 text-center text-sm font-semibold text-navy-900 tabular focus:outline-none"
                value={valor.cantidadRecibida}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value.replace(/\D/g, '') || '0', 10)
                  set({ cantidadRecibida: Math.min(n, 9999) })
                }}
              />
              <button
                type="button"
                className="grid size-9 place-items-center text-navy-800"
                onClick={() => set({ cantidadRecibida: valor.cantidadRecibida + 1 })}
                aria-label="Sumar uno"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      <Segmented
        nombre={`estado-${elemento.id}`}
        etiqueta={`Estado de ${elemento.nombre}`}
        opciones={OPCIONES}
        valor={valor.estado}
        onCambio={(estado) => set({ estado })}
      />
      {(errores?.estado || errores?.cantidadRecibida) && (
        <p role="alert" className="text-sm font-medium text-danger-700">
          {errores.estado ?? errores.cantidadRecibida}
        </p>
      )}

      {valor.estado === 'NOVEDAD' && (
        <div className="flex flex-col gap-3 border-t border-pearl-200 pt-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idObs} className="text-sm font-semibold text-navy-900">
              ¿Qué novedad encontraste?
            </label>
            <Textarea
              id={idObs}
              rows={2}
              maxLength={LIMITES.observacionMax}
              placeholder="Ej. Le falta el control remoto; enciende pero no proyecta."
              value={valor.observacion}
              onChange={(e) => set({ observacion: e.target.value })}
              aria-invalid={!!errores?.observacion}
            />
            {errores?.observacion && (
              <p role="alert" className="text-sm font-medium text-danger-700">
                {errores.observacion}
              </p>
            )}
          </div>
          <SelectorFotos
            fotos={valor.fotos}
            onCambio={(fotos) => set({ fotos })}
            error={errores?.fotoIds}
          />
        </div>
      )}
    </li>
  )
}
