import type { ReactNode } from 'react'

import { PanelShell } from '@/components/layout/panel-shell'
import { esEntregador, exigirSesion } from '@/servidor/auth/sesion'
import { redirect } from 'next/navigation'

/** Todo /panel exige una cuenta activa en CFG_Entregadores. Las acciones lo vuelven a exigir. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const sesion = await exigirSesion('/panel')
  if (!(await esEntregador(sesion))) redirect('/')
  return <PanelShell usuario={sesion}>{children}</PanelShell>
}
