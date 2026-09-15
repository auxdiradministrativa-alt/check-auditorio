'use client'

import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function BotonImprimir() {
  return (
    <Button variante="secundario" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden />
      Imprimir o guardar PDF
    </Button>
  )
}
