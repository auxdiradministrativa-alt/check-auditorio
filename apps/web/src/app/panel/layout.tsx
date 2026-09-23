import { Suspense, type ReactNode } from 'react'

import { PanelShell } from '@/components/layout/panel-shell'
import { exigirAccesoPanel } from '@/servidor/auth/sesion'
import { Marca } from '@/components/layout/marca'
import { Skeleton } from '@/components/ui/skeleton'

/** Todo /panel exige una cuenta activa en CFG_Entregadores. Las acciones lo vuelven a exigir. */
async function PanelAutorizado({ children }: { children: ReactNode }) {
  const sesion = await exigirAccesoPanel()
  return <PanelShell usuario={sesion}>{children}</PanelShell>
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh">
          <header className="border-b-2 border-primary bg-sidebar">
            <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
              <Marca href="/panel" />
            </div>
          </header>
          <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
            <h1 className="text-page sm:text-page-lg">Gestión de espacios</h1>
            <p role="status" className="text-sm text-muted-foreground">
              Verificando acceso al centro de gestión…
            </p>
            <Skeleton className="h-32 w-full" />
          </main>
        </div>
      }
    >
      <PanelAutorizado>{children}</PanelAutorizado>
    </Suspense>
  )
}
