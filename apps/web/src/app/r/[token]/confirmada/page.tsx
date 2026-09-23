import { CircleCheckBig, Undo2, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { formatearFechaHora } from '@/lib/fechas'
import { exigirSesion } from '@/servidor/auth/sesion'
import { registro } from '@/servidor/registro'
import { huella, urlDevolucion } from '@/servidor/tokens'

export const metadata: Metadata = { title: 'Recepción confirmada' }

type Props = { params: Promise<{ token: string }> }

export default async function Confirmada({ params }: Props) {
  const { token } = await params
  const sesion = await exigirSesion(`/r/${token}/confirmada`)
  const qr = await registro('qr.estado', { tokenSha256: huella(token) })
  const asignacion = qr?.asignacion
  const esSuya = asignacion?.receptor?.correo.toLowerCase() === sesion.correo.toLowerCase()
  if (!asignacion?.consecutivo || !esSuya) redirect(`/r/${token}`)

  const constancia = await registro('constancia.obtener', { consecutivo: asignacion.consecutivo })
  if (!constancia) redirect(`/r/${token}`)
  const { sello, devolucion } = constancia

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-ok-50 ring-1 ring-ok-700/20">
        <CircleCheckBig className="size-10 text-ok-700" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-600">Constancia sellada</p>
        <h1 className="text-page sm:text-page-lg">Recepción confirmada</h1>
        <p className="text-ink-600 tabular">{formatearFechaHora(sello.selladaEn)}</p>
      </div>

      <Card className="w-full overflow-hidden text-left">
        <div className="flex flex-col gap-4 bg-navy-900 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-navy-100">Consecutivo</p>
            <p className="text-page text-pearl-50 tabular sm:text-page-lg">{sello.consecutivo}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-medium text-navy-100">Código de verificación</p>
            <p className="font-mono text-card tracking-wider text-pearl-50 tabular">
              {sello.codigoVerificacion}
            </p>
          </div>
        </div>
        <CardBody className="flex flex-col gap-3 text-sm">
          <p className="flex items-start gap-2 text-ink-600">
            <Undo2 className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden />
            <span>
              {devolucion
                ? `Devolución declarada el ${formatearFechaHora(devolucion.declaradaEn)}.`
                : 'Al terminar el evento vuelve a esta página (escaneando el mismo QR) para declarar la devolución.'}
            </span>
          </p>
          <p className="flex items-start gap-2 text-ink-600">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden />
            <span>Guarda el código: con él se verifica que la constancia no fue alterada.</span>
          </p>
        </CardBody>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        {!devolucion && (
          <ButtonLink href={urlDevolucion(asignacion.id)} variante="oro">
            <Undo2 aria-hidden />
            Declarar devolución
          </ButtonLink>
        )}
        <ButtonLink href={`/verificar/${sello.consecutivo}`} variante="secundario">
          <ShieldCheck aria-hidden />
          Ver constancia
        </ButtonLink>
      </div>
    </div>
  )
}
