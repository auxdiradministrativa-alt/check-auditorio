import { createHash, createHmac, randomUUID } from 'node:crypto'

/*
 * Sonda de la conexión Vercel ↔ Apps Script, sin levantar la web:
 *   pnpm --filter @check-auditorio/web probar-gas     (lee apps/web/.env.local)
 * 1) GET  → la web app responde (despliegue y acceso «cualquiera» correctos).
 * 2) POST firmado `catalogo.listar` → el secreto HMAC coincide y el script abre el libro.
 * La firma replica `cadenaAFirmar` de packages/shared/src/protocolo.ts.
 */

const url = process.env.GAS_WEBAPP_URL
const secreto = process.env.GAS_HMAC_SECRET
if (!url || !secreto) {
  console.error('Faltan GAS_WEBAPP_URL y/o GAS_HMAC_SECRET en apps/web/.env.local')
  process.exit(1)
}

async function leer(res) {
  const texto = await res.text()
  try {
    return JSON.parse(texto)
  } catch {
    throw new Error(`Respuesta no JSON (${res.status}): ${texto.slice(0, 200)}`)
  }
}

const get = await leer(await fetch(url, { redirect: 'follow' }))
if (get.servicio !== 'check-auditorio') throw new Error(`GET inesperado: ${JSON.stringify(get)}`)
console.log('1/2 GET ok: la web app responde')

const accion = 'catalogo.listar'
const datos = '{}'
const ts = Math.floor(Date.now() / 1000)
const nonce = randomUUID()
const datosSha256 = createHash('sha256').update(datos, 'utf8').digest('hex')
const firma = createHmac('sha256', secreto)
  .update(`${accion}|${ts}|${nonce}|${datosSha256}`)
  .digest('hex')

const post = await leer(
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion, datos, ts, nonce, firma }),
    redirect: 'follow',
  }),
)
if (!post.ok) {
  console.error(`2/2 POST rechazado: ${post.codigo} — ${post.mensaje}`)
  process.exit(1)
}
const { espacios, elementos } = post.datos
console.log(
  `2/2 POST ok: firma aceptada · ${espacios.length} espacio(s), ${elementos.length} elementos`,
)
