import { LockKeyhole, LogIn, TimerOff } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Persona } from '@check-auditorio/shared'
import { Button } from '@/components/ui/button'
import { cerrarSesion } from '@/features/auth/acciones'
import { Ingreso } from '@/features/auth/ingreso'

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

const icono = (children: ReactNode, clase: string) => (
  <span className={`grid size-20 place-items-center rounded-full ${clase}`}>{children}</span>
)

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
