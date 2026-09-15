import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Entrega de espacios · Infraestructura',
    template: '%s · Infraestructura CUA',
  },
  description:
    'Constancia digital de entrega y devolución temporal de espacios de la Corporación Universitaria Americana.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0b1f3a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  )
}
