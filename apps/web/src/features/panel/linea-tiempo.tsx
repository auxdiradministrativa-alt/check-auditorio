import type { EstadoAsignacion } from '@check-auditorio/shared'

import { cn } from '@/lib/cn'

type Etapa = { clave: string; titulo: string; detalle: string }

const ETAPAS: Etapa[] = [
  { clave: 'creada', titulo: 'Entrega creada', detalle: 'Enlace y QR listos para compartir' },
  {
    clave: 'recepcion',
    titulo: 'Recepción del espacio',
    detalle: 'Revisión del estado del espacio',
  },
  { clave: 'acta', titulo: 'Acta firmada', detalle: 'Conformidad y novedades registradas' },
  {
    clave: 'devuelta',
    titulo: 'Espacio devuelto',
    detalle: 'Devolución declarada por quien recibió',
  },
]
const ORDEN: Record<EstadoAsignacion, number> = {
  INVITADA: -1,
  SOLICITADA: -1,
  RECHAZADA: -1,
  PROGRAMADA: 0,
  EN_VALIDACION: 0.5,
  EN_DILIGENCIAMIENTO: 0.5,
  RECIBIDA: 2,
  DEVOLUCION_VENCIDA: 2.5,
  DEVUELTA: 3,
  ANULADA: -1,
  EXPIRADA: -1,
}
export function LineaTiempo({ estado }: { estado: EstadoAsignacion }) {
  const etapas = ETAPAS
  const actual = ORDEN[estado]
  return (
    <ol className="flex flex-col">
      {etapas.map((etapa, i) => {
        const hecho = actual >= i
        const enCurso = !hecho && actual > i - 1
        return (
          <li key={etapa.clave} className="relative flex gap-3 pb-5 last:pb-0">
            {i < etapas.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-6 left-[0.6875rem] h-[calc(100%-1.25rem)] w-px',
                  hecho ? 'bg-primary-strong' : 'bg-border',
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                'relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2',
                hecho && 'border-primary-strong bg-primary-strong',
                enCurso && 'border-attention-accent bg-attention-soft',
                !hecho && !enCurso && 'border-border-strong bg-card',
              )}
            >
              {hecho && <span className="size-2 rounded-full bg-primary-strong-foreground" />}
            </span>
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-sm font-semibold',
                  hecho || enCurso ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {etapa.titulo}
                <span className="sr-only">
                  {hecho ? ' (completado)' : enCurso ? ' (en curso)' : ' (pendiente)'}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">{etapa.detalle}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
