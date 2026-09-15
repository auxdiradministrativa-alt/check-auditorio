import { Hourglass, TimerOff } from 'lucide-react'

import type { Persona } from '@check-auditorio/shared'

import { Avatar } from '@/components/ui/avatar'
import { Card, CardBody } from '@/components/ui/card'

export function PantallaEspera({ sesion }: { sesion: Persona }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <span className="relative grid size-20 place-items-center rounded-full bg-gold-50 ring-1 ring-gold-500/40">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold-500/15 motion-reduce:animate-none" />
        <Hourglass className="size-9 text-gold-700" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold">Esperando validación</h1>
        <p className="max-w-sm text-ink-600">
          Muéstrale esta pantalla a la persona de Infraestructura. Cuando confirme tu identidad,
          podrás diligenciar la constancia.
        </p>
      </div>
      <Card className="w-full max-w-sm">
        <CardBody className="flex items-center gap-3 text-left">
          <Avatar nombre={sesion.nombre} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{sesion.nombre}</p>
            <p className="truncate text-sm text-ink-600">{sesion.correo}</p>
          </div>
        </CardBody>
      </Card>
      <p className="text-xs text-ink-500" aria-live="polite">
        Esta pantalla se actualiza sola.
      </p>
    </div>
  )
}

export function PantallaExpirada() {
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-pearl-200">
        <TimerOff className="size-9 text-ink-600" aria-hidden />
      </span>
      <h1 className="font-display text-3xl font-semibold">Este QR ya no está vigente</h1>
      <p className="max-w-sm text-ink-600">
        Venció o ya se usó para otra recepción. Pide a Infraestructura que genere uno nuevo.
      </p>
    </div>
  )
}
