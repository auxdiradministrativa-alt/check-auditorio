import { Skeleton } from '@/components/ui/skeleton'

/**
 * Propio, y no el heredado de `/r/[token]`: aquí la constancia YA está sellada.
 * Decir «abriendo la entrega» en este punto invita a recargar o a reenviar,
 * que es lo último que debe hacer quien acaba de firmar.
 */
export default function CargandoConfirmacion() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-10">
      <Skeleton className="size-16 rounded-full" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 h-40 w-full rounded-card" />
      <p className="text-sm text-ink-600">Cargando tu constancia…</p>
    </div>
  )
}
