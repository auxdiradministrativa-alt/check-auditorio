import { CircleCheckBig, Mail, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { obtenerSesionReceptor } from '@/lib/datos/repositorio'
import { formatearFechaHora } from '@/lib/fechas'

export const metadata: Metadata = { title: 'Recepción confirmada' }

// Valores de ejemplo (fase 2: los devuelve el servidor al sellar).
const CONSECUTIVO = 'REC-000123'
const CODIGO = 'K7Q4-92MX'
const SELLADA = '2026-09-15T18:04:12-05:00'

export default async function Confirmada() {
  const sesion = await obtenerSesionReceptor()
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-ok-50 ring-1 ring-ok-700/20">
        <CircleCheckBig className="size-10 text-ok-700" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
          Constancia sellada
        </p>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Recepción confirmada</h1>
        <p className="text-ink-600 tabular">{formatearFechaHora(SELLADA)}</p>
      </div>

      <Card className="w-full overflow-hidden text-left">
        <div className="flex flex-col gap-4 bg-navy-900 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold-400 uppercase">
              Consecutivo
            </p>
            <p className="font-display text-3xl font-semibold text-pearl-50 tabular">
              {CONSECUTIVO}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold tracking-wide text-gold-400 uppercase">
              Código de verificación
            </p>
            <p className="font-mono text-lg font-semibold tracking-wider text-pearl-50 tabular">
              {CODIGO}
            </p>
          </div>
        </div>
        <CardBody className="flex flex-col gap-3 text-sm">
          <p className="flex items-start gap-2 text-ink-600">
            <Mail className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden />
            <span>
              Te enviaremos la constancia a{' '}
              <strong className="text-navy-900">{sesion.correo}</strong>, con el enlace para
              declarar la devolución al terminar el evento.
            </span>
          </p>
          <p className="flex items-start gap-2 text-ink-600">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden />
            <span>
              Guarda el código: con él cualquier persona autorizada puede verificar que la
              constancia no fue alterada.
            </span>
          </p>
        </CardBody>
      </Card>

      <ButtonLink href={`/verificar/${CONSECUTIVO}`} variante="secundario">
        <ShieldCheck aria-hidden />
        Ver constancia
      </ButtonLink>
    </div>
  )
}
