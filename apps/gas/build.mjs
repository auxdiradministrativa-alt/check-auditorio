import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'

import { build } from 'esbuild'

/*
 * Apps Script no carga módulos: se empaqueta todo en un IIFE y se declaran como funciones de
 * nivel superior las entradas que Google invoca (doGet, doPost) y las que se ejecutan a mano.
 * clasp 3 no transpila TypeScript, por eso se sube `dist/`.
 */

const pruebas = process.argv.includes('--pruebas')
const GLOBALES = ['doGet', 'doPost', 'instalar', 'procesarOutbox', 'reiniciarRegistroDePrueba']

if (pruebas) {
  rmSync('dist-pruebas', { recursive: true, force: true })
  const archivos = readdirSync('pruebas').filter((f) => f.endsWith('.test.ts'))
  await build({
    entryPoints: archivos.map((f) => `pruebas/${f}`),
    outdir: 'dist-pruebas',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outExtension: { '.js': '.mjs' },
    logLevel: 'warning',
  })
} else {
  rmSync('dist', { recursive: true, force: true })
  mkdirSync('dist')
  await build({
    entryPoints: ['src/infraestructura/gas/main.ts'],
    outfile: 'dist/codigo.js',
    bundle: true,
    format: 'iife',
    globalName: 'CheckAuditorio',
    // El runtime V8 de Apps Script no garantiza las APIs más recientes: sintaxis a ES2019.
    target: 'es2019',
    platform: 'neutral',
    charset: 'utf8',
    legalComments: 'none',
    footer: {
      js: GLOBALES.map((n) => `function ${n}(e) { return CheckAuditorio.${n}(e) }`).join('\n'),
    },
    logLevel: 'warning',
  })
  // Huella del código compilado: `doGet` la devuelve y `publicar` la compara con la URL publicada,
  // así una implementación que sirve otra versión se detecta en vez de pasar en silencio.
  const codigo = readFileSync('dist/codigo.js', 'utf8')
  const huella = createHash('sha256').update(codigo).digest('hex').slice(0, 16)
  writeFileSync('dist/codigo.js', `${codigo}\nvar CHECK_AUDITORIO_HUELLA = '${huella}'\n`)
  copyFileSync('appsscript.json', 'dist/appsscript.json')
  console.log(`dist/ listo para clasp push · huella ${huella}`)
}
