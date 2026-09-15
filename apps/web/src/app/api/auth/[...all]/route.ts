import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/servidor/auth/better-auth'
import { entorno } from '@/servidor/entorno'

const noDisponible = () => new Response('No disponible en modo local.', { status: 404 })

export async function GET(req: Request) {
  return entorno().auth === 'google' ? toNextJsHandler(auth()).GET(req) : noDisponible()
}

export async function POST(req: Request) {
  return entorno().auth === 'google' ? toNextJsHandler(auth()).POST(req) : noDisponible()
}
