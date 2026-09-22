import { Skeleton } from '@/components/ui/skeleton'

export default function CargandoDevolucion() {
  return (
    <div className="flex flex-col gap-5 py-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="mt-2 h-32 w-full rounded-card" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <p className="text-center text-sm text-ink-600">Abriendo la devolución…</p>
    </div>
  )
}
