'use client'

import { Camera, X } from 'lucide-react'
import Image from 'next/image'
import { useId } from 'react'

import { LIMITES } from '@check-auditorio/shared'

import { cn } from '@/lib/cn'
import { uuid } from '@/lib/uuid'

import type { FotoLocal } from './tipos'

export function SelectorFotos({
  fotos,
  onCambio,
  error,
}: {
  fotos: FotoLocal[]
  onCambio: (fotos: FotoLocal[]) => void
  error?: string | undefined
}) {
  const id = useId()
  const restantes = LIMITES.fotosPorNovedadMax - fotos.length

  function agregar(archivos: FileList | null) {
    if (!archivos) return
    const nuevas = Array.from(archivos)
      .filter((a) => a.type.startsWith('image/'))
      .slice(0, restantes)
      .map((a) => ({ id: uuid(), url: URL.createObjectURL(a), nombre: a.name }))
    onCambio([...fotos, ...nuevas])
  }

  function quitar(foto: FotoLocal) {
    URL.revokeObjectURL(foto.url)
    onCambio(fotos.filter((f) => f.id !== foto.id))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative size-20 overflow-hidden rounded-lg border border-pearl-300"
          >
            <Image
              src={foto.url}
              alt={`Foto: ${foto.nombre}`}
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => quitar(foto)}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-navy-950/80 text-pearl-50"
              aria-label={`Quitar ${foto.nombre}`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
        {restantes > 0 && (
          <label
            htmlFor={id}
            className={cn(
              'flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-gold-500',
              error
                ? 'border-danger-700/50 bg-danger-50 text-danger-700'
                : 'border-pearl-300 bg-white text-navy-700 hover:border-navy-500/50',
            )}
          >
            <Camera className="size-5" aria-hidden />
            Foto
            <input
              id={id}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => {
                agregar(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
      <p
        className={cn('text-xs', error ? 'font-medium text-danger-700' : 'text-ink-600')}
        role={error ? 'alert' : undefined}
      >
        {error ?? `Hasta ${LIMITES.fotosPorNovedadMax} fotos.`}
      </p>
    </div>
  )
}
