import 'server-only'

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { connection } from 'next/server'

import { entorno, exigirEntornoCompleto } from '../entorno'
import { registro, ErrorRegistro } from './index'
import { enviarAGas } from './cliente-gas'

// React comparte estas promesas solo durante el render actual; los estados siguen frescos.
export const listarAsignaciones = cache(() => registro('asignacion.listar', {}))

// Solo configuración de espacios y elementos. Nunca sesiones, permisos, QR ni estados.
// La URL separa despliegues; los errores no se guardan como resultados válidos.
const catalogoGas = (url: string) =>
  unstable_cache(
    async () => {
      const respuesta = await enviarAGas('catalogo.listar', {})
      if (!respuesta.ok) throw new ErrorRegistro(respuesta.codigo, respuesta.mensaje)
      return respuesta.datos
    },
    ['catalogo-espacios-v1', url],
    { revalidate: 60 },
  )()

export const listarCatalogo = cache(async () => {
  await connection()
  exigirEntornoCompleto()
  return entorno().registro === 'gas'
    ? catalogoGas(entorno().gas.url)
    : registro('catalogo.listar', {})
})
