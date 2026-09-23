import 'server-only'

import QRCode from 'qrcode'

/** QR en SVG generado en servidor; corrección media para que se lea desde una pantalla. */
export const qrSvg = (texto: string) =>
  QRCode.toString(texto, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#1a1f2e', light: '#ffffff' },
  })
