import { execSync } from 'node:child_process'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { setDefaultResultOrder } from 'node:dns'
import { existsSync, readFileSync } from 'node:fs'

/*
 * Publica el núcleo en la implementación que usa la web, y comprueba que quedó publicado:
 *   pnpm --filter @check-auditorio/gas publicar
 *
 * 1. Cuenta de clasp = la dueña.  2. build + push.  3. Nueva versión.
 * 4. Apunta A ESA VERSIÓN la implementación cuya URL es GAS_WEBAPP_URL (la misma de Vercel), así
 *    nunca nace una implementación con otra URL que la web no usa.
 * 5. Verifica: GET devuelve la huella del código recién compilado y un POST firmado pasa.
 * Si la URL sirve otro código, falla y lo dice: nada queda «publicado» en silencio.
 */

// En esta red Node se cuelga por IPv6 al conectar con Google; curl no (medido 2026-09-23).
setDefaultResultOrder('ipv4first')

const CUENTA_DUENA = 'auxdiradministrativa@americana.edu.co'
const env = new URL('../../web/.env.local', import.meta.url)
if (existsSync(env)) process.loadEnvFile(env)
const url = process.env.GAS_WEBAPP_URL
const secreto = process.env.GAS_HMAC_SECRET
const id = url?.match(/\/macros\/s\/([\w-]+)\/exec/)?.[1]
if (!url || !secreto || !id) {
  console.error(
    'Falta GAS_WEBAPP_URL (…/macros/s/<id>/exec) o GAS_HMAC_SECRET en apps/web/.env.local',
  )
  process.exit(1)
}

const correr = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
const paso = (n, texto) => console.log(`${n}/5 ${texto}`)

if (!correr('clasp -u duena show-authorized-user').includes(CUENTA_DUENA)) {
  console.error(
    `clasp no está autenticado como ${CUENTA_DUENA}: pnpm --filter @check-auditorio/gas login`,
  )
  process.exit(1)
}
paso(1, `cuenta ${CUENTA_DUENA}`)

correr('node build.mjs')
const huella = readFileSync('dist/codigo.js', 'utf8').match(/CHECK_AUDITORIO_HUELLA = '(\w+)'/)?.[1]
if (!huella) throw new Error('El build no escribió la huella')
correr('clasp -u duena push -f')
paso(2, `push del código · huella ${huella}`)

const commit = correr('git rev-parse --short HEAD').trim()
const descripcion = `${commit} · ${huella}`
const version = correr(`clasp -u duena create-version "${descripcion}"`).match(
  /version (\d+)/i,
)?.[1]
if (!version) throw new Error('clasp no informó el número de versión creada')
paso(3, `versión ${version} (${descripcion})`)

correr(`clasp -u duena update-deployment ${id} -V ${version} -d "${descripcion}"`)
paso(4, `implementación de la web → versión ${version}`)

// Google tarda unos segundos en servir la versión nueva: se reintenta antes de declarar fallo.
let servida = null
for (let intento = 1; intento <= 6 && servida !== huella; intento++) {
  if (intento > 1) await new Promise((r) => setTimeout(r, 5000))
  servida = await fetch(url, { redirect: 'follow' })
    .then((r) => r.json())
    .then((j) => j.huella ?? null)
    .catch(() => null)
}
if (servida !== huella) {
  console.error(
    `La URL de la web sirve la huella ${servida}, no ${huella}. Revisa «Gestionar implementaciones».`,
  )
  process.exit(1)
}

const accion = 'catalogo.listar'
const datos = '{}'
const ts = Math.floor(Date.now() / 1000)
const nonce = randomUUID()
const sha = createHash('sha256').update(datos, 'utf8').digest('hex')
const firma = createHmac('sha256', secreto).update(`${accion}|${ts}|${nonce}|${sha}`).digest('hex')
const post = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ accion, datos, ts, nonce, firma }),
  redirect: 'follow',
}).then((r) => r.json())
if (!post.ok) {
  console.error(`POST firmado rechazado: ${post.codigo} — ${post.mensaje}`)
  process.exit(1)
}
paso(5, `la web sirve la huella ${huella} y acepta la firma · publicado`)
