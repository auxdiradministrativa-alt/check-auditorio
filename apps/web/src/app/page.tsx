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
    <div className="flex min-h-dvh flex-col border-t-4 border-navy-900 bg-pearl-100">
      <AvisoDemo />

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section className="w-full max-w-115 min-w-0 rounded-card border border-pearl-200 bg-white p-6 text-center shadow-card sm:p-10">
          <Image
            src="/logo-americana-completo.png"
            alt="Corporación Universitaria Americana"
            width={748}
            height={333}
            priority
            className="mx-auto h-auto w-full max-w-[16rem]"
          />

          <span aria-hidden className="mx-auto mt-7 block h-px w-12 bg-gold-600/60" />

          <p className="mt-6 text-sm font-medium text-ink-600">Infraestructura</p>

          <h1 className="mt-3 text-page text-navy-900 sm:text-page-lg">Bienvenido</h1>
          <p className="mt-2 text-base text-ink-600">Ingresa con tu cuenta institucional</p>

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

      <footer className="px-4 pb-8 text-center text-xs text-ink-600">
        Corporación Universitaria Americana
      </footer>
    </div>
  )
}
