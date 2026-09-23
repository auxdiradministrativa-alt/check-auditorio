import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { build } from 'esbuild'

/*
 * Vista previa de los correos: compila las plantillas (como `build.mjs --pruebas`), genera los
 * seis correos con datos de ejemplo y los escribe en `apps/gas/tmp/*.html` con un índice.
 * Se abre `tmp/index.html` en el navegador. `tmp/` no se versiona.
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = join(raiz, 'tmp')
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp)

const entrada = `
import {
  correoConfirmacion, correoConstanciaDestinatarios, correoConstanciaReceptor,
  correoEntrega, correoVencida,
} from './src/aplicacion/correo/plantillas'

const e = {
  id: '5b1d7c1e-2f7a-4c0b-9a51-6f2f0c1d9e11',
  evento: 'Conversatorio de investigación: ciudades & agua',
  espacio: 'Auditorio Principal',
  inicio: '2026-09-15T10:00:00-05:00',
  fin: '2026-09-15T12:00:00-05:00',
  urlApp: 'https://check-auditorio-web.vercel.app',
}
const persona = { para: 'laura.perez@americana.edu.co', nombre: 'Laura Pérez' }
const c = {
  ...e,
  consecutivo: 'REC-000123',
  codigoVerificacion: 'K7Q2-9XPA',
  receptorNombre: 'Laura Pérez',
  receptorCorreo: 'laura.perez@americana.edu.co',
  dependencia: 'Facultad de Ingeniería',
  novedades: 2,
  devolverAntesDe: '2026-09-16T12:00:00-05:00',
}
const fijos = ['infraestructura@americana.edu.co']

export const correos = [
  ['entrega-programada', 'Entrega programada', correoEntrega({ ...e, ...persona })],
  ['confirmacion', 'Confirmación de recepción', correoConfirmacion({ ...e, ...persona })],
  ['constancia-receptor', 'Constancia · receptor', correoConstanciaReceptor(c)],
  ['constancia-destinatarios', 'Constancia · destinatarios fijos', correoConstanciaDestinatarios(fijos, c)],
  ['vencida', 'Devolución vencida', correoVencida(fijos, { ...e, receptorNombre: c.receptorNombre,
    receptorCorreo: c.receptorCorreo, consecutivo: c.consecutivo }, 24)],
]
`

const salida = join(tmp, 'vista.mjs')
await build({
  stdin: {
    contents: entrada,
    resolveDir: raiz,
    loader: 'ts',
    sourcefile: 'vista-correo-entrada.ts',
  },
  outfile: salida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  logLevel: 'warning',
})
const { correos } = await import(pathToFileURL(salida).href)
rmSync(salida)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const filas = []
for (const [archivo, titulo, m] of correos) {
  writeFileSync(join(tmp, `${archivo}.html`), m.html)
  const kb = (Buffer.byteLength(m.html, 'utf8') / 1024).toFixed(1)
  filas.push(
    `<li><a href="${archivo}.html">${esc(titulo)}</a><br><small>Para: ${esc(m.para.join(', '))} · Asunto: ${esc(m.asunto)} · ${kb} KB</small></li>`,
  )
}
writeFileSync(
  join(tmp, 'index.html'),
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Correos · vista previa</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.5}li{margin:0 0 14px}small{color:#6b7280}</style>
</head><body><h1>Correos de Check Auditorio</h1><ul>
${filas.join('\n')}
</ul></body></html>`,
)
console.log(`${correos.length} correos · abrir ${join(tmp, 'index.html')}`)
