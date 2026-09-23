import { SearchX } from 'lucide-react'

import { PublicShell } from '@/components/layout/public-shell'
import { ButtonLink } from '@/components/ui/button'

export default function NoEncontrado() {
  return (
    <PublicShell>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <SearchX className="size-10 text-attention-accent" aria-hidden />
        <h1 className="text-page sm:text-page-lg">No encontramos esta página</h1>
        <p className="max-w-sm text-muted-foreground">
          El enlace puede estar incompleto o ya no estar vigente. Si escaneaste un QR, pide a
          Infraestructura que lo verifique.
        </p>
        <ButtonLink href="/" variante="secundario">
          Ir al inicio
        </ButtonLink>
      </div>
    </PublicShell>
  )
}
