import { randomBytes } from 'node:crypto'

/*
 * Genera los dos secretos del sistema (48 bytes aleatorios en base64url = 64 caracteres).
 * Se imprimen solo en la terminal: no se escriben en ningún fichero ni se registran.
 *   GAS_HMAC_SECRET     → .env.local, Vercel Y propiedad del script de Apps Script (mismo valor)
 *   BETTER_AUTH_SECRET  → .env.local y Vercel. Deriva los tokens de QR y devolución:
 *                         cambiarlo invalida los QR y enlaces ya emitidos.
 */

const secreto = () => randomBytes(48).toString('base64url')

console.log(`GAS_HMAC_SECRET=${secreto()}`)
console.log(`BETTER_AUTH_SECRET=${secreto()}`)
