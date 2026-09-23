import { Skeleton } from '@/components/ui/skeleton'

/**
 * Lo primero que ve quien acaba de escanear el QR. Sin esto, el teléfono se queda
 * varios segundos en blanco y parece que el código no sirvió.
 */
export default function CargandoRecepcion() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Skeleton className="size-16 rounded-full" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-sm" />
      <Skeleton className="h-4 w-2/3 max-w-xs" />
      <Skeleton className="mt-4 h-28 w-full rounded-card" />
      <Skeleton className="h-20 w-full rounded-card" />
      <p className="text-sm text-muted-foreground">Abriendo la entrega…</p>
    </div>
  )
}
