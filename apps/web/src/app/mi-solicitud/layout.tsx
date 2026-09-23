import type { ReactNode } from 'react'

import { PublicShell } from '@/components/layout/public-shell'

export default function MiSolicitudLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>
}
