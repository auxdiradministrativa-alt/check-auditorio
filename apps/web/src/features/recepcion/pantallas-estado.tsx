import {
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  FileClock,
  Hourglass,
  LockKeyhole,
  LogIn,
  TimerOff,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { ETIQUETAS_ROL, type Asignacion, type Persona } from '@check-auditorio/shared'

import { RefrescoAutomatico } from '@/components/refresco-automatico'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { cerrarSesion } from '@/features/auth/acciones'
import { Ingreso } from '@/features/auth/ingreso'
import { BotonConfirmarRecepcion } from '@/features/solicitud/boton-confirmar'
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

/** Resumen de lo que diligenció quien solicita: evento, franja y sus datos. */
function TarjetaSolicitud({ asignacion }: { asignacion: Asignacion }) {
  const s = asignacion.solicitud
  return (
    <Card className="w-full max-w-sm text-left">
      <CardBody className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Tu solicitud</p>
          <p className="text-card-title">{asignacion.evento}</p>
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {formatearFechaLarga(asignacion.inicio)} ·{' '}
            <span className="tabular">{formatearFranja(asignacion.inicio, asignacion.fin)}</span>
          </p>
        </div>
        {s && (
          <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
            <div className="col-span-2">
              <dt className="text-muted-foreground">Rol y dependencia</dt>
              <dd className="font-medium">
                {ETIQUETAS_ROL[s.rol]} · {s.dependencia}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Celular</dt>
              <dd className="font-medium tabular">{s.celular}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Asistentes</dt>
              <dd className="font-medium tabular">{s.asistentesEstimados}</dd>
            </div>
          </dl>
        )}
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
        Este QR se habilita a las{' '}
        <span className="font-medium text-foreground tabular">
          {formatearHora(asignacion.recepcionDesde)}
        </span>
        , antes del inicio ({formatearHora(asignacion.inicio)}).
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

/* ───────────────────────── Flujo por enlace personal ───────────────────────── */

/** Sin sesión: no se muestra nada del evento, porque aún no se sabe quién abrió el enlace. */
export function PantallaIngresarPersonal({ destino }: { destino: string }) {
  return (
    <Pantalla
      icono={icono(<LogIn className="size-9 text-primary-strong" aria-hidden />, 'bg-primary-soft')}
      titulo="Identifícate para continuar"
    >
      <p className="max-w-sm text-muted-foreground">
        Este enlace es personal. Inicia sesión con la cuenta institucional a la que Infraestructura
        te lo envió.
      </p>
      <div className="w-full max-w-sm text-left">
        <Ingreso destino={destino} />
      </div>
    </Pantalla>
  )
}

/** Otra cuenta con el enlace: ni evento, ni franja, ni a quién se envió. */
export function PantallaPersonal({ sesion, destino }: { sesion: Persona; destino: string }) {
  return (
    <Pantalla
      icono={icono(
        <LockKeyhole className="size-9 text-muted-foreground" aria-hidden />,
        'bg-border',
      )}
      titulo="Este enlace es personal"
    >
      <p className="max-w-sm text-muted-foreground">
        Solo lo puede abrir la cuenta a la que Infraestructura lo envió. Iniciaste sesión como{' '}
        <span className="font-medium text-foreground">{sesion.correo}</span>.
      </p>
      <form action={cerrarSesion}>
        <input type="hidden" name="destino" value={destino} />
        <Button type="submit" variante="secundario">
          Entrar con otra cuenta
        </Button>
      </form>
    </Pantalla>
  )
}

export function PantallaEnRevision({ asignacion }: { asignacion: Asignacion }) {
  return (
    <Pantalla
      icono={icono(
        <FileClock className="size-9 text-attention" aria-hidden />,
        'bg-attention-soft ring-1 ring-attention-accent/40',
      )}
      titulo="Solicitud en revisión"
    >
      <RefrescoAutomatico ms={30_000} />
      <p className="max-w-sm text-muted-foreground">
        Infraestructura revisará tu solicitud. Te avisaremos por correo cuando la apruebe o si
        necesita que corrijas algo; también puedes volver a este enlace.
      </p>
      <TarjetaSolicitud asignacion={asignacion} />
    </Pantalla>
  )
}

export function PantallaAprobadaEsperando({ asignacion }: { asignacion: Asignacion }) {
  const desde = asignacion.recepcionDesde
  return (
    <Pantalla
      icono={icono(
        <CalendarCheck className="size-9 text-success" aria-hidden />,
        'bg-success-soft ring-1 ring-success/20',
      )}
      titulo="Solicitud aprobada"
    >
      <p className="max-w-sm text-muted-foreground">
        Podrás confirmar la recepción del espacio desde las{' '}
        <span className="font-medium text-foreground tabular">{formatearHora(desde)}</span> del{' '}
        {formatearFechaLarga(desde)}, desde este mismo enlace. Te enviaremos un correo como
        recordatorio.
      </p>
      <TarjetaSolicitud asignacion={asignacion} />
    </Pantalla>
  )
}

export function PantallaConfirmar({
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
      icono={icono(
        <ClipboardCheck className="size-9 text-primary-strong" aria-hidden />,
        'bg-primary-soft',
      )}
      titulo="Confirma la recepción"
    >
      <p className="max-w-sm text-muted-foreground">
        Revisa el estado del espacio. Si todo está bien, lo confirmas en un paso; si algo no lo
        está, lo reportas con una foto. Tu cuenta queda como firma de la constancia.
      </p>
      <TarjetaEvento asignacion={asignacion} />
      <TarjetaPersona persona={sesion} />
      <BotonConfirmarRecepcion token={token} />
    </Pantalla>
  )
}
