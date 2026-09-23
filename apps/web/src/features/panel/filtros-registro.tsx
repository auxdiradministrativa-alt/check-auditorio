'use client'

import { RefreshCw, Search } from 'lucide-react'
import { ETIQUETAS_ESTADO_ASIGNACION, type Espacio } from '@check-auditorio/shared'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'

export type FiltrosGestion = {
  busqueda: string
  espacio: string
  estado: string
  desde: string
  hasta: string
}
export const FILTROS_VACIOS: FiltrosGestion = {
  busqueda: '',
  espacio: '',
  estado: '',
  desde: '',
  hasta: '',
}

export function FiltrosRegistro({
  filtros,
  espacios,
  actualizando,
  onCambiar,
  onLimpiar,
  onActualizar,
}: {
  filtros: FiltrosGestion
  espacios: Espacio[]
  actualizando: boolean
  onCambiar: (campo: keyof FiltrosGestion, valor: string) => void
  onLimpiar: () => void
  onActualizar: () => void
}) {
  const { busqueda, espacio, estado, desde, hasta } = filtros
  const fechasInvalidas = !!(desde && hasta && desde > hasta)
  return (
    <section
      aria-labelledby="titulo-filtros"
      className="flex flex-col gap-4 rounded-card border border-pearl-200 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-filtros" className="text-section">
          Buscar en la gestión
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variante="fantasma" tamano="sm" onClick={onLimpiar}>
            Limpiar filtros
          </Button>
          <Button variante="secundario" tamano="sm" disabled={actualizando} onClick={onActualizar}>
            <RefreshCw
              aria-hidden
              className={actualizando ? 'animate-spin motion-reduce:animate-none' : ''}
            />
            {actualizando ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(14rem,1.5fr)_repeat(2,minmax(0,1fr))]">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
          <span className="flex items-center gap-1">
            <Search className="size-3.5" aria-hidden />
            Evento, receptor o consecutivo
          </span>
          <Input
            type="search"
            value={busqueda}
            placeholder="Buscar en todas las reservas"
            onChange={(e) => onCambiar('busqueda', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
          Espacio
          <Select value={espacio} onChange={(e) => onCambiar('espacio', e.target.value)}>
            <option value="">Todos los espacios</option>
            {espacios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
          Desde
          <Input type="date" value={desde} onChange={(e) => onCambiar('desde', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
          Hasta
          <Input
            type="date"
            value={hasta}
            min={desde || undefined}
            aria-invalid={fechasInvalidas}
            onChange={(e) => onCambiar('hasta', e.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex max-w-full min-w-0 flex-wrap items-center gap-2 text-sm">
          Estado
          <Select
            className="w-full sm:w-auto"
            value={estado}
            onChange={(e) => onCambiar('estado', e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ETIQUETAS_ESTADO_ASIGNACION).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </Select>
        </label>
        <p className="text-xs text-ink-600">
          Los filtros se aplican a las reservas y al registro histórico.
        </p>
      </div>
      {fechasInvalidas && (
        <p role="alert" className="text-sm text-danger-700">
          La fecha final debe ser igual o posterior a la inicial.
        </p>
      )}
    </section>
  )
}
