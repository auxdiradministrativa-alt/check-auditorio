import 'server-only'

import { ErrorAccion } from '../accion'
import { esEntregador, obtenerSesion, sesionReciente, type Sesion } from './sesion'

/* Guardas para Server Actions: se llaman DENTRO de cada acción, nunca se confía en la página. */

export async function requerirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion()
  if (!sesion) throw new ErrorAccion('SESION', 'Tu sesión terminó. Vuelve a iniciar sesión.')
  return sesion
}

export async function requerirEntregador(): Promise<Sesion> {
  const sesion = await requerirSesion()
  if (!(await esEntregador(sesion)))
    throw new ErrorAccion('NO_AUTORIZADO', 'Tu cuenta no está autorizada para esta acción.')
  return sesion
}

export async function requerirSesionParaFirmar(): Promise<Sesion> {
  const sesion = await requerirSesion()
  if (!sesionReciente(sesion))
    throw new ErrorAccion('REAUTENTICAR', 'Por seguridad, vuelve a iniciar sesión antes de firmar.')
  return sesion
}
