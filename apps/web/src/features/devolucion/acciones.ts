'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { devolucionInputSchema, type DevolucionInput } from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion, ErrorAccion } from '@/servidor/accion'
import { requerirSesionParaFirmar } from '@/servidor/auth/permisos'
import { registro } from '@/servidor/registro'
import { tokenDevolucionValido } from '@/servidor/tokens'

/** Solo quien recibió, con su enlace personal. El núcleo vuelve a exigir que la cuenta coincida. */
export async function declararDevolucion(
  asignacionId: string,
  token: string,
  entrada: DevolucionInput,
): Promise<Resultado> {
  return ejecutarAccion(async () => {
    const id = z.uuid().parse(asignacionId)
    if (!tokenDevolucionValido(id, token))
      throw new ErrorAccion('NO_AUTORIZADO', 'El enlace de devolución no es válido.')
    const sesion = await requerirSesionParaFirmar()
    await registro('devolucion.registrar', {
      asignacionId: id,
      receptor: { nombre: sesion.nombre, correo: sesion.correo, sub: sesion.sub },
      datos: devolucionInputSchema.parse(entrada),
    })
    revalidatePath('/panel', 'layout')
  })
}
