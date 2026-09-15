import 'server-only'

import { z } from 'zod'

/*
 * Configuración del servidor, validada una vez. Dos modos por pieza:
 *  - registro: `gas` (Apps Script firmado) o `memoria` (núcleo en proceso, solo desarrollo)
 *  - auth:     `google` (Better Auth) o `local` (cookie firmada, solo desarrollo)
 * En producción ambos modos locales están prohibidos: falta de variables = error, no degradación.
 */

const esquema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  GAS_WEBAPP_URL: z.url().optional(),
  GAS_HMAC_SECRET: z.string().min(32).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
})

const SECRETO_DESARROLLO = 'solo-desarrollo-local-no-usar-en-produccion-000000'

function cargar() {
  const vacioComoAusente = Object.fromEntries(
    Object.keys(esquema.shape).map((k) => [k, process.env[k] || undefined]),
  )
  const env = esquema.parse(vacioComoAusente)
  const produccion = process.env.NODE_ENV === 'production'

  const registro = env.GAS_WEBAPP_URL && env.GAS_HMAC_SECRET ? 'gas' : 'memoria'
  const auth =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.BETTER_AUTH_SECRET ? 'google' : 'local'

  return {
    /** En producción los modos locales están prohibidos; lo exige `exigirEntornoCompleto`. */
    incompletoEnProduccion: produccion && (registro !== 'gas' || auth !== 'google'),
    appUrl: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ''),
    registro,
    auth,
    gas: { url: env.GAS_WEBAPP_URL ?? '', secreto: env.GAS_HMAC_SECRET ?? SECRETO_DESARROLLO },
    google: { clientId: env.GOOGLE_CLIENT_ID ?? '', clientSecret: env.GOOGLE_CLIENT_SECRET ?? '' },
    /** Firma cookies locales y deriva los tokens de QR y devolución. */
    secretoApp: env.BETTER_AUTH_SECRET ?? SECRETO_DESARROLLO,
    esLocal: registro === 'memoria' || auth === 'local',
  } as const
}

let cache: ReturnType<typeof cargar> | null = null

/** Se evalúa en la primera petición, no al importar (el build no necesita secretos). */
export const entorno = () => (cache ??= cargar())

/** Se llama antes de tocar datos o sesión: en producción, falta de variables = error, no degradación. */
export function exigirEntornoCompleto() {
  if (entorno().incompletoEnProduccion)
    throw new Error(
      'Faltan variables de entorno de producción: GAS_WEBAPP_URL, GAS_HMAC_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET.',
    )
}
