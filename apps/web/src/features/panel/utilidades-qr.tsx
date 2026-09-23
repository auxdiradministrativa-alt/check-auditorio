'use client'

import { Copy, Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function UtilidadesQr({
  svg,
  enlace,
  evento,
}: {
  svg: string
  enlace: string
  evento: string
}) {
  const [mensaje, setMensaje] = useState('')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace)
      setMensaje('Enlace copiado. Puedes enviarlo al solicitante.')
    } catch {
      setMensaje('No se pudo copiar. Usa el enlace de recepción que aparece debajo.')
    }
  }

  function descargar() {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `QR-${evento.replace(/[^\p{L}\p{N}-]/gu, '-').slice(0, 80)}.svg`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variante="secundario" tamano="sm" onClick={copiar}>
          <Copy aria-hidden />
          Copiar enlace
        </Button>
        <Button variante="secundario" tamano="sm" onClick={descargar}>
          <Download aria-hidden />
          Descargar QR
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {mensaje}
      </p>
    </div>
  )
}
