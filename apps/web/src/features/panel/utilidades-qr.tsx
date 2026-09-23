'use client'

import { Copy, Download, MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function UtilidadesQr({
  svg,
  enlace,
  evento,
  mensaje,
}: {
  svg: string
  enlace: string
  evento: string
  /** Texto listo para WhatsApp o correo (flujo por enlace). Sin él no se ofrece el botón. */
  mensaje?: string
}) {
  const [aviso, setAviso] = useState('')

  async function copiar(texto: string, exito: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setAviso(exito)
    } catch {
      setAviso('No se pudo copiar. Usa el enlace que aparece debajo.')
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
        <Button
          variante="secundario"
          tamano="sm"
          onClick={() => copiar(enlace, 'Enlace copiado. Puedes enviarlo al solicitante.')}
        >
          <Copy aria-hidden />
          Copiar enlace
        </Button>
        {mensaje && (
          <Button
            variante="secundario"
            tamano="sm"
            onClick={() => copiar(mensaje, 'Mensaje copiado. Pégalo en WhatsApp o en un correo.')}
          >
            <MessageSquareText aria-hidden />
            Copiar mensaje
          </Button>
        )}
        <Button variante="secundario" tamano="sm" onClick={descargar}>
          <Download aria-hidden />
          Descargar QR
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {aviso}
      </p>
    </div>
  )
}
