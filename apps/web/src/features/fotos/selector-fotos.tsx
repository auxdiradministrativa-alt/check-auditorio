'use client'

import { Camera, LoaderCircle, RotateCw, X } from 'lucide-react'
import Image from 'next/image'
import { useId } from 'react'

import { LIMITES } from '@check-auditorio/shared'

import { cn } from '@/lib/cn'
import { uuid } from '@/lib/uuid'

import { subirFoto } from './acciones'
import { comprimirFoto } from './comprimir'
import type { CambioFotos, FotoLocal } from './tipos'

/** Toma o elige fotos, las comprime y las sube una por una en cuanto se agregan. */
export function SelectorFotos({
  asignacionId,
  fotos,
  onCambio,
  error,
}: {
  asignacionId: string
  fotos: FotoLocal[]
  onCambio: CambioFotos
  error?: string | undefined
}) {
  const id = useId()
  const restantes = LIMITES.fotosPorNovedadMax - fotos.length
  const reemplazar = (fotoId: string, cambios: Partial<FotoLocal>) =>
    onCambio((previas) => previas.map((f) => (f.id === fotoId ? { ...f, ...cambios } : f)))

  async function subir(foto: FotoLocal, archivo: File) {
    reemplazar(foto.id, { estado: 'subiendo' })
    try {
      const datos = new FormData()
      datos.set('asignacionId', asignacionId)
      datos.set(
        'archivo',
        new File([await comprimirFoto(archivo)], `${foto.id}.jpg`, { type: 'image/jpeg' }),
      )
      const r = await subirFoto(datos)
      reemplazar(foto.id, r.ok ? { estado: 'lista', remotoId: r.datos.id } : { estado: 'error' })
    } catch {
      reemplazar(foto.id, { estado: 'error' })
    }
  }

  function agregar(lista: FileList | null) {
    if (!lista) return
    const nuevas = Array.from(lista)
      .filter((a) => a.type.startsWith('image/'))
      .slice(0, restantes)
      .map((archivo) => ({
        archivo,
        foto: {
          id: uuid(),
          url: URL.createObjectURL(archivo),
          nombre: archivo.name,
          estado: 'subiendo',
          remotoId: null,
        } satisfies FotoLocal,
      }))
    onCambio((previas) => [...previas, ...nuevas.map((n) => n.foto)])
    for (const { foto, archivo } of nuevas) void subir(foto, archivo)
  }

  async function reintentar(foto: FotoLocal) {
    const archivo = await fetch(foto.url).then((r) => r.blob())
    void subir(foto, new File([archivo], foto.nombre, { type: archivo.type }))
  }

  function quitar(foto: FotoLocal) {
    URL.revokeObjectURL(foto.url)
    onCambio((previas) => previas.filter((f) => f.id !== foto.id))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className={cn(
              'relative size-20 overflow-hidden rounded-lg border',
              foto.estado === 'error' ? 'border-danger-700' : 'border-pearl-300',
            )}
          >
            <Image
              src={foto.url}
              alt={`Foto: ${foto.nombre}`}
              fill
              unoptimized
              className="object-cover"
            />
            {foto.estado === 'subiendo' && (
              <span className="absolute inset-0 grid place-items-center bg-navy-950/45">
                <LoaderCircle
                  className="size-6 animate-spin text-pearl-50"
                  aria-label="Subiendo foto"
                />
              </span>
            )}
            {foto.estado === 'error' && (
              <button
                type="button"
                onClick={() => reintentar(foto)}
                className="absolute inset-0 grid place-items-center bg-danger-700/60 text-pearl-50"
                aria-label={`Reintentar subir ${foto.nombre}`}
              >
                <RotateCw className="size-6" aria-hidden />
              </button>
            )}
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
        {error ??
          (fotos.some((f) => f.estado === 'error')
            ? 'Una foto no se pudo subir: tócala para reintentar.'
            : `Hasta ${LIMITES.fotosPorNovedadMax} fotos.`)}
      </p>
    </div>
  )
}
