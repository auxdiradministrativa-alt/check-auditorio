import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'

import { build } from 'esbuild'

/*
 * Apps Script no carga módulos: se empaqueta todo en un IIFE y se declaran como funciones de
 * nivel superior las entradas que Google invoca (doGet, doPost) y las que se ejecutan a mano.
 * clasp 3 no transpila TypeScript, por eso se sube `dist/`.
 */

const pruebas = process.argv.includes('--pruebas')
const GLOBALES = ['doGet', 'doPost', 'instalar', 'procesarOutbox']

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
  copyFileSync('appsscript.json', 'dist/appsscript.json')
  console.log('dist/ listo para clasp push')
}
