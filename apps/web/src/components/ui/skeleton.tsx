import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

/**
 * Bloque de carga con la forma del contenido que va a llegar.
 * Existe porque Apps Script tarda entre 3 y 7 segundos: sin esto la navegación
 * se queda en la página anterior y parece que la app no respondió.
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-lg bg-border/80 motion-reduce:animate-none', className)}
      {...props}
    />
  )
}

/**
 * Anuncio para lectores de pantalla. Los bloques de esqueleto son `aria-hidden`,
 * así que sin esto la página se anuncia vacía durante los segundos de espera.
 */
export function AvisoCargando({ children = 'Cargando…' }: { children?: string }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  )
}

/** Cabecera de página en carga: antetítulo, título y descripción. */
export function SkeletonPageHeader({ conAccion = false }: { conAccion?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-64 sm:h-10 sm:w-80" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {conAccion && <Skeleton className="h-11 w-44 shrink-0 rounded-xl" />}
    </div>
  )
}

/** Filas de una lista o tabla en carga. */
export function SkeletonFilas({ filas = 4 }: { filas?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: filas }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2 max-w-xs" />
            <Skeleton className="h-3 w-1/3 max-w-48" />
          </div>
          <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  )
}
