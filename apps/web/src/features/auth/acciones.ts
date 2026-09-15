'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DOMINIO_INSTITUCIONAL } from '@check-auditorio/shared'

import type { Resultado } from '@/lib/resultado'
import { ejecutarAccion, ErrorAccion } from '@/servidor/accion'
import { auth } from '@/servidor/auth/better-auth'
import { abrirSesionLocal, cerrarSesionLocal } from '@/servidor/auth/sesion-local'
import { entorno } from '@/servidor/entorno'

/** Solo rutas internas: evita redirecciones abiertas con `?destino=https://…`. */
const destinoSeguro = (destino: unknown) =>
  typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//')
    ? destino
    : '/panel'

export async function iniciarSesionGoogle(formData: FormData) {
  const destino = destinoSeguro(formData.get('destino'))
  if (entorno().auth !== 'google') redirect(`/?destino=${encodeURIComponent(destino)}`)
  const { url } = await auth().api.signInSocial({
    body: { provider: 'google', callbackURL: destino, errorCallbackURL: '/?error=cuenta' },
    headers: await headers(),
  })
  if (!url) redirect('/?error=cuenta')
  redirect(url)
}

const ingresoLocal = z.object({
  nombre: z.string().trim().min(3, 'Escribe tu nombre.'),
  correo: z
    .email('Correo inválido.')
    .refine((c) => c.toLowerCase().endsWith(`@${DOMINIO_INSTITUCIONAL}`), {
      error: `Solo cuentas @${DOMINIO_INSTITUCIONAL}.`,
    }),
})

export async function ingresarLocal(
  _previo: Resultado | null,
  formData: FormData,
): Promise<Resultado> {
  const resultado = await ejecutarAccion(async () => {
    if (entorno().auth !== 'local')
      throw new ErrorAccion('NO_AUTORIZADO', 'Ingreso local deshabilitado.')
    const { nombre, correo } = ingresoLocal.parse({
      nombre: formData.get('nombre'),
      correo: formData.get('correo'),
    })
    await abrirSesionLocal(nombre, correo.toLowerCase())
  })
  if (resultado.ok) redirect(destinoSeguro(formData.get('destino')))
  return resultado
}

export async function cerrarSesion() {
  if (entorno().auth === 'local') await cerrarSesionLocal()
  else await auth().api.signOut({ headers: await headers() })
  redirect('/')
}
