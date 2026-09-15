import 'server-only'

import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

import { DOMINIO_INSTITUCIONAL } from '@check-auditorio/shared'

import { entorno } from '../entorno'

const OCHO_HORAS = 60 * 60 * 8

function crear() {
  const env = entorno()
  return betterAuth({
    baseURL: env.appUrl,
    secret: env.secretoApp,
    // Sin base de datos: la sesión vive en una cookie cifrada (JWE).
    session: {
      expiresIn: OCHO_HORAS,
      cookieCache: { enabled: true, maxAge: OCHO_HORAS, strategy: 'jwe', refreshCache: true },
    },
    account: { storeStateStrategy: 'cookie', storeAccountCookie: true },
    user: {
      additionalFields: { googleSub: { type: 'string', required: false, input: false } },
    },
    socialProviders: {
      google: {
        clientId: env.google.clientId,
        clientSecret: env.google.clientSecret,
        // Better Auth rechaza el inicio si el claim `hd` del id token no es el dominio.
        hd: DOMINIO_INSTITUCIONAL,
        // PC compartidos: siempre se elige la cuenta, nunca entra la última sesión sola.
        prompt: 'select_account',
        mapProfileToUser: (perfil) => ({ googleSub: perfil.sub }),
      },
    },
    plugins: [nextCookies()],
  })
}

let instancia: ReturnType<typeof crear> | null = null
export const auth = () => (instancia ??= crear())
