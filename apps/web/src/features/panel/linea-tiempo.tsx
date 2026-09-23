import type { EstadoAsignacion } from '@check-auditorio/shared'

import { cn } from '@/lib/cn'

type Etapa = { clave: string; titulo: string; detalle: string }

/** Flujo anterior: Infraestructura crea el evento y valida a quien escanea el QR. */
const ETAPAS_QR: Etapa[] = [
  { clave: 'programada', titulo: 'Programada', detalle: 'QR disponible para escanear' },
  {
    clave: 'validada',
    titulo: 'Identidad validada',
    detalle: 'Infraestructura confirma a quien recibe',
  },
  { clave: 'recibida', titulo: 'Constancia firmada', detalle: 'Checklist y términos aceptados' },
  {
    clave: 'devuelta',
    titulo: 'Devolución declarada',
    detalle: 'Quien recibió cierra el préstamo',
  },
]

const ORDEN_QR: Record<EstadoAsignacion, number> = {
  INVITADA: -1,
  SOLICITADA: -1,
  RECHAZADA: -1,
  PROGRAMADA: 0,
  EN_VALIDACION: 0.5,
  EN_DILIGENCIAMIENTO: 1.5,
  RECIBIDA: 2,
  DEVOLUCION_VENCIDA: 2.5,
  DEVUELTA: 3,
  ANULADA: -1,
  EXPIRADA: -1,
}

/** Flujo por enlace (spec 2026-09-23): quien solicita propone y Infraestructura aprueba. */
const ETAPAS_ENLACE: Etapa[] = [
  {
    clave: 'emitido',
    titulo: 'Enlace emitido',
    detalle: 'Infraestructura lo envía a quien solicita',
  },
  { clave: 'solicitada', titulo: 'Solicitud diligenciada', detalle: 'Evento, horario y datos' },
  { clave: 'aprobada', titulo: 'Aprobada', detalle: 'El espacio queda reservado' },
  { clave: 'recibida', titulo: 'Constancia firmada', detalle: 'Checklist y términos aceptados' },
  {
    clave: 'devuelta',
    titulo: 'Devolución declarada',
    detalle: 'Quien recibió cierra el préstamo',
  },
]

const ORDEN_ENLACE: Record<EstadoAsignacion, number> = {
  // Medio paso = la etapa siguiente está en curso.
  INVITADA: 0.5,
  // Devuelta para corregir: vuelve a quedar en curso la etapa de diligenciar.
  RECHAZADA: 0.5,
  SOLICITADA: 1.5,
  PROGRAMADA: 2,
  EN_VALIDACION: 2,
  EN_DILIGENCIAMIENTO: 2.5,
  RECIBIDA: 3,
  DEVOLUCION_VENCIDA: 3.5,
  DEVUELTA: 4,
  ANULADA: -1,
  EXPIRADA: -1,
}

export function LineaTiempo({
  estado,
  porEnlace = false,
}: {
  estado: EstadoAsignacion
  /** La asignación nació de un enlace personal (`invitadoCorreo` presente). */
  porEnlace?: boolean
}) {
  const etapas = porEnlace ? ETAPAS_ENLACE : ETAPAS_QR
  const actual = (porEnlace ? ORDEN_ENLACE : ORDEN_QR)[estado]
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
              <span className="text-sm text-muted-foreground">
                {enCurso && estado === 'RECHAZADA' && etapa.clave === 'solicitada'
                  ? 'Devuelta para corregir'
                  : etapa.detalle}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
