'use server'

import { z } from 'zod'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion, ErrorAccion } from '@/servidor/accion'
import { requerirSesion } from '@/servidor/auth/permisos'
import { registro } from '@/servidor/registro'

const BYTES_MAXIMOS = 3 * 1024 * 1024

/** Sube una foto a Drive (vía el registro) y devuelve su id. El núcleo verifica que sea del receptor. */
export async function subirFoto(formData: FormData): Promise<Resultado<{ id: string }>> {
  return ejecutarAccion(async () => {
    const sesion = await requerirSesion()
    const asignacionId = z.uuid().parse(formData.get('asignacionId'))
    const archivo = formData.get('archivo')
    if (!(archivo instanceof File) || archivo.size === 0)
      throw new ErrorAccion('DATOS_INVALIDOS', 'No llegó la foto.')
    if (archivo.size > BYTES_MAXIMOS)
      throw new ErrorAccion('DATOS_INVALIDOS', 'La foto supera 3 MB incluso comprimida.')
    const base64 = Buffer.from(await archivo.arrayBuffer()).toString('base64')
    return registro('foto.subir', {
      asignacionId,
      actor: { nombre: sesion.nombre, correo: sesion.correo, sub: sesion.sub },
      mime: archivo.type || 'image/jpeg',
      base64,
    })
  })
}
