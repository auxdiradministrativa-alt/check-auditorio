import { GoogleButton } from '@/components/ui/google-button'
import { entorno } from '@/servidor/entorno'

import { iniciarSesionGoogle } from './acciones'
import { FormIngresoLocal } from './form-ingreso-local'

/** Punto único de inicio de sesión; elige Google o el formulario local según el entorno. */
export function Ingreso({ destino }: { destino: string }) {
  if (entorno().auth === 'local') return <FormIngresoLocal destino={destino} />
  return (
    <form action={iniciarSesionGoogle}>
      <input type="hidden" name="destino" value={destino} />
      <GoogleButton>Continuar con Google</GoogleButton>
    </form>
  )
}
