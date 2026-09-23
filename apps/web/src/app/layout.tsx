import type { Metadata, Viewport } from 'next'
import { Antic, JetBrains_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

// Familias del tema Sage Garden, autoalojadas por next/font. Antic solo existe en peso 400.
const antic = Antic({ weight: '400', subsets: ['latin'], variable: '--font-antic' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

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
  // Mismo tono que la barra superior (token sidebar).
  themeColor: '#fafaf8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Next desactiva el desplazamiento suave durante la navegación entre rutas.
    <html
      lang="es-CO"
      data-scroll-behavior="smooth"
      className={`${antic.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
