import { ClipboardCheck, QrCode, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { DOMINIO_INSTITUCIONAL } from '@check-auditorio/shared'

import { AvisoDemo } from '@/components/layout/aviso-demo'
import { Marca } from '@/components/layout/marca'
import { GoogleButton } from '@/components/ui/google-button'

export const metadata: Metadata = { title: 'Ingresar' }

const PASOS = [
  {
    icono: QrCode,
    titulo: 'Escanea el QR',
    texto: 'Infraestructura te lo muestra al entregarte el espacio.',
  },
  {
    icono: ClipboardCheck,
    titulo: 'Verifica lo que recibes',
    texto: 'Revisa cada elemento y reporta novedades con foto.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Confirma con tu cuenta',
    texto: 'Tu cuenta institucional queda como firma de la constancia.',
  },
] as const

export default function Ingreso() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AvisoDemo />
      <div className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
        <section className="relative flex flex-col justify-between gap-12 overflow-hidden bg-navy-900 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full border border-gold-500/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-[20rem] rounded-full border border-gold-500/10"
          />
          <Marca />
          <div className="relative flex max-w-lg flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-400 uppercase">
              Entrega temporal de espacios
            </p>
            <h1 className="font-display text-4xl leading-[1.1] font-semibold text-pearl-50 sm:text-5xl">
              Recibe el espacio con constancia digital.
            </h1>
            <p className="text-base leading-relaxed text-navy-100/85">
              Registro de entrega y devolución del auditorio, verificado elemento por elemento y
              firmado con tu cuenta institucional.
            </p>
          </div>
          <ol className="relative grid gap-4 sm:grid-cols-3">
            {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
              <li key={titulo} className="flex flex-col gap-2 border-t border-gold-500/30 pt-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-pearl-50">
                  <span className="text-gold-400 tabular">0{i + 1}</span>
                  <Icono className="size-4 text-gold-400" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-pearl-50">{titulo}</span>
                <span className="text-sm text-navy-100/75">{texto}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl font-semibold text-navy-900">Ingresar</h2>
              <p className="text-[0.9375rem] text-ink-600">
                Usa tu cuenta <strong className="text-navy-900">@{DOMINIO_INSTITUCIONAL}</strong>.
              </p>
            </div>
            <GoogleButton href="/panel">Continuar con Google</GoogleButton>
            <div className="flex flex-col gap-3 rounded-xl border border-pearl-200 bg-pearl-50 p-4 text-sm text-ink-600">
              <p>
                <strong className="text-navy-900">¿Vas a recibir un espacio?</strong> No necesitas
                entrar aquí: escanea el QR que te muestra Infraestructura.
              </p>
              <p className="border-t border-pearl-200 pt-3 text-xs">
                Vista previa del flujo:{' '}
                <Link
                  href="/r/demo"
                  className="font-semibold text-navy-700 underline underline-offset-2"
                >
                  recepción
                </Link>{' '}
                ·{' '}
                <Link
                  href="/devolucion/asg-001"
                  className="font-semibold text-navy-700 underline underline-offset-2"
                >
                  devolución
                </Link>{' '}
                ·{' '}
                <Link
                  href="/verificar/REC-000123"
                  className="font-semibold text-navy-700 underline underline-offset-2"
                >
                  verificación
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
