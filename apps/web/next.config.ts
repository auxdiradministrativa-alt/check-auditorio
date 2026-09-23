import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Las pruebas no comparten compilación ni bloqueo con el servidor de desarrollo.
  distDir: process.env.CHECK_E2E === '1' ? '.next-e2e' : '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  // Los paquetes del monorepo se consumen como TypeScript fuente.
  transpilePackages: ['@check-auditorio/shared', '@check-auditorio/gas'],
  experimental: {
    // Fotos ya comprimidas en el cliente (≤1600 px, JPEG): holgura para base64 y multipart.
    serverActions: { bodySizeLimit: '4mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
