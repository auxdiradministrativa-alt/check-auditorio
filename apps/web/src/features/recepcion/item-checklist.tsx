'use client'

import type { ElementoCatalogo, EstadoElemento } from '@check-auditorio/shared'
import { LIMITES } from '@check-auditorio/shared'

import { Segmented } from '@/components/ui/segmented'
import { Textarea } from '@/components/ui/field'
import { cn } from '@/lib/cn'

import { SelectorFotos } from '@/features/fotos/selector-fotos'

import type { CambioItem, ErroresItem, ItemEstado } from './tipos'

const OPCIONES = [
  { valor: 'CONFORME', etiqueta: 'Conforme', tono: 'ok' },
  { valor: 'NOVEDAD', etiqueta: 'Novedad', tono: 'peligro' },
] as const satisfies readonly { valor: EstadoElemento; etiqueta: string; tono: 'ok' | 'peligro' }[]

export function ItemChecklist({
  asignacionId,
  elemento,
  valor,
  errores,
  onCambio,
}: {
  asignacionId: string
  elemento: ElementoCatalogo
  valor: ItemEstado
  errores?: ErroresItem | undefined
  onCambio: CambioItem
}) {
  const set = (parcial: Partial<ItemEstado>) => onCambio((previo) => ({ ...previo, ...parcial }))
  const idObs = `obs-${elemento.id}`

  return (
    <li
      id={`item-${elemento.id}`}
      className={cn(
        'flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-card p-4 transition-colors',
        valor.estado === 'NOVEDAD' ? 'border-destructive/30' : 'border-border',
        errores?.estado && 'border-destructive/50',
      )}
    >
      <span className="font-semibold text-foreground">{elemento.nombre}</span>

      <Segmented
        nombre={`estado-${elemento.id}`}
        etiqueta={`Estado de ${elemento.nombre}`}
        opciones={OPCIONES}
        valor={valor.estado}
        onCambio={(estado) => set({ estado })}
      />
      {errores?.estado && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errores.estado}
        </p>
      )}

      {valor.estado === 'NOVEDAD' && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idObs} className="text-sm font-semibold text-foreground">
              ¿Qué novedad encontraste?
            </label>
            <Textarea
              id={idObs}
              rows={2}
              maxLength={LIMITES.observacionMax}
              placeholder="Ej. Hay una mancha de humedad en el muro izquierdo, junto a la puerta."
              value={valor.observacion}
              onChange={(e) => set({ observacion: e.target.value })}
              aria-invalid={!!errores?.observacion}
            />
            {errores?.observacion && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errores.observacion}
              </p>
            )}
          </div>
          <SelectorFotos
            asignacionId={asignacionId}
            fotos={valor.fotos}
            onCambio={(actualizar) =>
              onCambio((previo) => ({ ...previo, fotos: actualizar(previo.fotos) }))
            }
            error={errores?.fotoIds}
          />
        </div>
      )}
    </li>
  )
}
