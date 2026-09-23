import { CalendarClock, Hourglass, LogIn, TimerOff } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Asignacion, Persona } from '@check-auditorio/shared'

import { RefrescoAutomatico } from '@/components/refresco-automatico'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardBody } from '@/components/ui/card'
import { Ingreso } from '@/features/auth/ingreso'
import { formatearFechaLarga, formatearFranja, formatearHora } from '@/lib/fechas'

import { BotonSolicitar } from './boton-solicitar'

function Pantalla({
  icono,
  titulo,
  children,
}: {
  icono: ReactNode
  titulo: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {icono}
      <h1 className="text-page sm:text-page-lg">{titulo}</h1>
      {children}
    </div>
  )
}

function TarjetaEvento({ asignacion }: { asignacion: Asignacion }) {
  return (
    <Card className="w-full max-w-sm text-left">
      <CardBody className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Entrega</p>
        <p className="text-card-title">{asignacion.evento}</p>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {formatearFechaLarga(asignacion.inicio)} ·{' '}
          <span className="tabular">{formatearFranja(asignacion.inicio, asignacion.fin)}</span>
        </p>
      </CardBody>
    </Card>
  )
}

function TarjetaPersona({ persona }: { persona: Persona }) {
  return (
    <Card className="w-full max-w-sm">
      <CardBody className="flex items-center gap-3 text-left">
        <Avatar nombre={persona.nombre} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{persona.nombre}</p>
          <p className="truncate text-sm text-muted-foreground">{persona.correo}</p>
        </div>
      </CardBody>
    </Card>
  )
}

const icono = (children: ReactNode, clase: string) => (
  <span className={`grid size-20 place-items-center rounded-full ${clase}`}>{children}</span>
)

export function PantallaIngresar({ asignacion, token }: { asignacion: Asignacion; token: string }) {
  return (
    <Pantalla
      icono={icono(<LogIn className="size-9 text-primary-strong" aria-hidden />, 'bg-primary-soft')}
      titulo="Identifícate para recibir"
    >
      <p className="max-w-sm text-muted-foreground">
        Inicia sesión con tu cuenta institucional. Esa cuenta queda como firma de la constancia.
      </p>
      <TarjetaEvento asignacion={asignacion} />
      <div className="w-full max-w-sm text-left">
        <Ingreso destino={`/r/${token}`} />
      </div>
    </Pantalla>
  )
}

export function PantallaSolicitar({
  asignacion,
  sesion,
  token,
}: {
  asignacion: Asignacion
  sesion: Persona
  token: string
}) {
  return (
    <Pantalla
      icono={icono(<LogIn className="size-9 text-primary-strong" aria-hidden />, 'bg-primary-soft')}
      titulo="Confirma quién recibe"
    >
      <p className="max-w-sm text-muted-foreground">
        Vas a solicitar la recepción del espacio con esta cuenta. Infraestructura confirmará que
        eres tú.
      </p>
      <TarjetaEvento asignacion={asignacion} />
      <TarjetaPersona persona={sesion} />
      <BotonSolicitar token={token} />
    </Pantalla>
  )
}

export function PantallaEspera({ sesion }: { sesion: Persona }) {
  return (
    <Pantalla
      icono={
        <span className="relative grid size-20 place-items-center rounded-full bg-attention-soft ring-1 ring-attention-accent/40">
          <span className="absolute inset-0 animate-ping rounded-full bg-attention-accent/15 motion-reduce:animate-none" />
          <Hourglass className="size-9 text-attention" aria-hidden />
        </span>
      }
      titulo="Esperando validación"
    >
      <RefrescoAutomatico />
      <p className="max-w-sm text-muted-foreground">
        Muéstrale esta pantalla a la persona de Infraestructura. Cuando confirme tu identidad,
        podrás diligenciar la constancia.
      </p>
      <TarjetaPersona persona={sesion} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Esta pantalla se actualiza sola.
      </p>
    </Pantalla>
  )
}

export function PantallaAunNoVigente({ asignacion }: { asignacion: Asignacion }) {
  return (
    <Pantalla
      icono={icono(
        <CalendarClock className="size-9 text-muted-foreground" aria-hidden />,
        'bg-border',
      )}
      titulo="Aún no puedes recibir"
    >
      <p className="max-w-sm text-muted-foreground">
        Este QR se habilita 30 minutos antes del inicio ({formatearHora(asignacion.inicio)}).
      </p>
      <TarjetaEvento asignacion={asignacion} />
    </Pantalla>
  )
}

export function PantallaExpirada() {
  return (
    <Pantalla
      icono={icono(<TimerOff className="size-9 text-muted-foreground" aria-hidden />, 'bg-border')}
      titulo="Este QR ya no está vigente"
    >
      <p className="max-w-sm text-muted-foreground">
        Venció, fue anulado o ya se usó para otra recepción. Pide a Infraestructura que genere uno
        nuevo.
      </p>
    </Pantalla>
  )
}
