import { Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'

import { DOMINIO_INSTITUCIONAL } from '@check-auditorio/shared'

import { AvisoDemo } from '@/components/layout/aviso-demo'
import { Button } from '@/components/ui/button'
import { cerrarSesion } from '@/features/auth/acciones'
import { Ingreso } from '@/features/auth/ingreso'
import { esEntregador, obtenerSesion } from '@/servidor/auth/sesion'

export const metadata: Metadata = { title: 'Ingresar' }

type Props = { searchParams: Promise<{ destino?: string; error?: string }> }

export default async function PaginaIngreso({ searchParams }: Props) {
  const { destino, error } = await searchParams
  const destinoInterno = destino?.startsWith('/') && !destino.startsWith('//') ? destino : null
  const sesion = await obtenerSesion()
  if (sesion && destinoInterno) redirect(destinoInterno)
  if (sesion && (await esEntregador(sesion))) redirect('/panel')

  return (
    <div className="relative flex min-h-dvh flex-col bg-navy-900">
      {/*
       * Fondo en tres capas, todas en CSS: resplandor radial detrás de la tarjeta
       * y dos arcos dorados en las esquinas opuestas. Van en una capa aparte con
       * `overflow-hidden` para que los círculos no generen scroll horizontal; el
       * contenedor que sí debe poder desplazarse (el de arriba) no lo recorta.
       */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-168 max-w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-600/35 blur-[120px]" />
        <div className="absolute -top-56 -right-40 size-168 rounded-full border border-gold-500/25" />
        <div className="absolute -top-32 -right-16 size-120 rounded-full border border-gold-500/15" />
        <div className="absolute -bottom-64 -left-48 size-184 rounded-full border border-gold-500/25" />
        <div className="absolute -bottom-40 -left-24 size-128 rounded-full border border-gold-500/15" />
      </div>

      <AvisoDemo />

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section className="w-full max-w-115 rounded-3xl border border-gold-500/40 bg-pearl-75 p-7 text-center shadow-[0_1px_2px_rgb(8_21_40/0.2),0_30px_60px_-24px_rgb(8_21_40/0.55)] sm:p-10">
          <Image
            src="/logo-americana-completo.png"
            alt="Corporación Universitaria Americana"
            width={748}
            height={333}
            priority
            className="mx-auto h-auto w-full max-w-[16rem]"
          />

          <span aria-hidden className="mx-auto mt-7 block h-px w-12 bg-gold-600/60" />

          <p className="mt-6 text-[0.6875rem] font-semibold tracking-[0.3em] text-gold-700 uppercase">
            Infraestructura
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-navy-900">
            Bienvenido
          </h1>
          <p className="mt-2 text-[0.9375rem] text-ink-600">Ingresa con tu cuenta institucional</p>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-danger-700/25 bg-danger-50 p-3 text-sm text-danger-700"
            >
              No se pudo iniciar sesión. Usa una cuenta @{DOMINIO_INSTITUCIONAL}.
            </p>
          )}

          <div className="mt-7 text-left">
            {sesion ? (
              <div className="flex flex-col gap-3 rounded-xl border border-pearl-300 bg-pearl-50 p-4 text-sm text-ink-600">
                <p>
                  Entraste como <strong className="text-navy-900">{sesion.correo}</strong>, pero
                  esta cuenta no está autorizada para el panel de Infraestructura.
                </p>
                <form action={cerrarSesion}>
                  <Button type="submit" variante="secundario" tamano="sm">
                    Cambiar de cuenta
                  </Button>
                </form>
              </div>
            ) : (
              <Ingreso destino={destinoInterno ?? '/panel'} />
            )}
          </div>

          <p className="mt-4 text-sm text-ink-600">@{DOMINIO_INSTITUCIONAL}</p>

          <p className="mt-7 flex items-center justify-center gap-2 border-t border-pearl-300 pt-5 text-sm text-ink-600">
            <Lock className="size-4 text-ink-500" aria-hidden />
            Acceso interno
          </p>
        </section>
      </main>

      <footer className="relative px-4 pb-8 text-center text-xs tracking-wide text-navy-100/70">
        Corporación Universitaria Americana
      </footer>
    </div>
  )
}
