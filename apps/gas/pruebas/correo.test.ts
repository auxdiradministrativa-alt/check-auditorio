import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import type { Mensaje } from '../src/aplicacion/puertos'
import { COLORES } from '../src/aplicacion/correo/colores'
import {
  correoConfirmacion,
  correoConstanciaDestinatarios,
  correoConstanciaReceptor,
  correoDecision,
  correoVencida,
  escapar,
  fechaLarga,
  franja,
  LIMITE_BYTES,
  textoPlano,
  type DatosConstancia,
  type DatosEvento,
} from '../src/aplicacion/correo/plantillas'

/*
 * Plantillas de correo. Cada prueba lleva su control negativo: una aserción que demuestra que
 * la comprobación mira algo (un VERDE de una prueba que no mira nada es peor que no probar).
 */

const URL_APP = 'https://check-auditorio-web.vercel.app'

const evento = (sobre: Partial<DatosEvento> = {}): DatosEvento => ({
  id: '5b1d7c1e-2f7a-4c0b-9a51-6f2f0c1d9e11',
  evento: 'Conversatorio de investigación',
  espacio: 'Auditorio Principal',
  inicio: '2026-09-15T10:00:00-05:00',
  fin: '2026-09-15T12:00:00-05:00',
  urlApp: URL_APP,
  ...sobre,
})

const constancia = (sobre: Partial<DatosConstancia> = {}): DatosConstancia => ({
  ...evento(),
  consecutivo: 'REC-000123',
  codigoVerificacion: 'K7Q2-9XPA',
  receptorNombre: 'Laura Pérez',
  receptorCorreo: 'laura.perez@americana.edu.co',
  dependencia: 'Facultad de Ingeniería',
  novedades: 1,
  devolverAntesDe: '2026-09-16T12:00:00-05:00',
  ...sobre,
})

/** Los seis correos con los mismos datos, para barrer propiedades comunes. */
function todos(e: DatosEvento, c: DatosConstancia, motivo: string, nombre: string) {
  return {
    aprobada: correoDecision(
      { ...e, para: 'laura.perez@americana.edu.co', nombre, aprobada: true, motivo: null },
      30,
    ),
    devuelta: correoDecision(
      { ...e, para: 'laura.perez@americana.edu.co', nombre, aprobada: false, motivo },
      30,
    ),
    confirmacion: correoConfirmacion({ ...e, para: 'laura.perez@americana.edu.co', nombre }),
    receptor: correoConstanciaReceptor(c),
    destinatarios: correoConstanciaDestinatarios(['infraestructura@americana.edu.co'], c),
    vencida: correoVencida(
      ['infraestructura@americana.edu.co'],
      {
        ...e,
        receptorNombre: c.receptorNombre,
        receptorCorreo: c.receptorCorreo,
        consecutivo: c.consecutivo,
      },
      24,
    ),
  } satisfies Record<string, Mensaje>
}

const bytes = (s: string) => Buffer.byteLength(s, 'utf8')
const ocurrencias = (s: string, sub: string) => s.split(sub).length - 1

/* ─── a) Escapado ─── */

test('a) ningún texto del usuario llega crudo al HTML de ningún correo', () => {
  const XSS = `<script>alert(1)</script>`
  const COMILLA = `x" onmouseover="alert(2)`
  const APOS = `O'Brien`
  const AMP = `Ciencia & Arte`
  const peligroso = `${XSS} ${COMILLA} ${APOS} ${AMP}`
  const e = evento({ evento: peligroso, espacio: peligroso })
  const c = constancia({
    ...e,
    receptorNombre: peligroso,
    dependencia: peligroso,
    consecutivo: `REC-${XSS}`,
  })
  const correos = todos(e, c, peligroso, peligroso)

  for (const [nombre, m] of Object.entries(correos)) {
    for (const crudo of [XSS, '<script', COMILLA, APOS, AMP])
      assert.ok(!m.html.includes(crudo), `${nombre}: aparece crudo ${JSON.stringify(crudo)}`)
    // Control negativo: el texto SÍ llegó al HTML, escapado. Sin esto la prueba pasaría también
    // si la plantilla simplemente no mostrara el evento.
    assert.ok(m.html.includes(escapar(XSS)), `${nombre}: el evento no aparece escapado`)
    assert.ok(m.html.includes('O&#39;Brien') && m.html.includes('Ciencia &amp; Arte'), nombre)
  }
  // El motivo solo va en la devuelta: se comprueba que está, escapado.
  assert.ok(correos.devuelta.html.includes(`Motivo: ${escapar(peligroso)}`))
})

/* ─── b) Tamaño ─── */

test('b) cada correo pesa menos que el límite de Gmail, con datos realistas y al máximo', () => {
  const largo = (n: number, base: string) => base.repeat(Math.ceil(n / base.length)).slice(0, n)
  // Al máximo: evento 160, motivo 300; con tildes y ñ (2 bytes en UTF-8) para no subestimar.
  const eMax = evento({
    evento: largo(160, 'Año académico ñandú '),
    espacio: largo(120, 'Salón múltiple '),
  })
  const cMax = constancia({
    ...eMax,
    receptorNombre: largo(120, 'María José Ñúñez '),
    dependencia: largo(160, 'Vicerrectoría académica '),
    novedades: 40,
  })
  const casos = {
    realistas: todos(evento(), constancia(), 'Falta el número de asistentes.', 'Laura Pérez'),
    maximos: todos(
      eMax,
      cMax,
      largo(300, 'Revisión de términos ñ '),
      largo(120, 'María José Ñúñez '),
    ),
  }
  for (const [caso, correos] of Object.entries(casos))
    for (const [nombre, m] of Object.entries(correos)) {
      const b = bytes(m.html)
      assert.ok(b < LIMITE_BYTES, `${caso}/${nombre}: ${b} B ≥ ${LIMITE_BYTES} B`)
    }

  // Control negativo: la medida de verdad detecta un correo que se pasa del límite.
  const inflado = correoDecision(
    {
      ...evento(),
      para: 'x@americana.edu.co',
      nombre: 'X',
      aprobada: false,
      motivo: largo(LIMITE_BYTES, 'ñ'),
    },
    30,
  )
  assert.ok(bytes(inflado.html) >= LIMITE_BYTES)
  // Y mide bytes, no caracteres: «ñ» vale 2.
  assert.equal(bytes('ñ'), 2)
})

/* ─── c) Botón y enlace de respaldo ─── */

test('c) los correos al solicitante llevan /mi-solicitud/<id> en botón y en texto', () => {
  const e = evento()
  const url = `${URL_APP}/mi-solicitud/${e.id}`
  const c = todos(e, constancia(), 'Motivo', 'Laura Pérez')

  // Botón (href del <a> del botón) + respaldo (href y texto visible del enlace de copia).
  assert.ok(ocurrencias(c.confirmacion.html, url) >= 2, 'confirmación sin botón + respaldo')
  assert.ok(c.confirmacion.html.includes(`>${url}</a>`), 'confirmación sin la URL visible en texto')
  for (const nombre of ['aprobada', 'devuelta', 'receptor'] as const)
    assert.ok(ocurrencias(c[nombre].html, url) >= 2, `${nombre} sin /mi-solicitud/`)
  // El texto plano también la lleva (clientes sin HTML).
  assert.ok(c.confirmacion.texto.includes(url))

  // Control negativo: el id se codifica; un id con «/» no puede abrir otra ruta.
  const raro = todos(evento({ id: 'a/b?c' }), constancia(), 'M', 'L')
  assert.ok(raro.confirmacion.html.includes('/mi-solicitud/a%2Fb%3Fc'))
  assert.ok(!raro.confirmacion.html.includes('/mi-solicitud/a/b'))
})

/* ─── d) Privacidad ─── */

test('d) los correos a destinatarios fijos no llevan enlaces personales, celular ni correo del receptor', () => {
  const CELULAR = '3001234567'
  // Se le pasa un celular como campo extra, como lo haría un caso de uso que reenvía la fila
  // entera: la plantilla no debe mostrarlo.
  const fila = { ...constancia(), celular: CELULAR }
  const c = todos(evento(), fila, 'Motivo', 'Laura Pérez')
  const celular = /\b3\d{9}\b/

  for (const nombre of ['destinatarios', 'vencida'] as const) {
    const m = c[nombre]
    assert.ok(!m.html.includes('/mi-solicitud/'), `${nombre}: enlace personal`)
    assert.ok(!m.texto.includes('/mi-solicitud/'), `${nombre}: enlace personal en texto`)
    assert.ok(!celular.test(m.html) && !celular.test(m.texto), `${nombre}: celular`)
  }
  // Destinatarios: ni el correo del receptor (decisión de la plantilla: nombre y dependencia).
  assert.ok(!c.destinatarios.html.includes(fila.receptorCorreo))
  assert.ok(!c.destinatarios.texto.includes(fila.receptorCorreo))
  // Vencida SÍ lo lleva, a propósito: es la alerta a Infraestructura, que necesita contactar a
  // quien no devolvió. Se fija aquí para que cambiarlo sea una decisión, no un accidente.
  assert.ok(c.vencida.html.includes(fila.receptorCorreo))

  // Control negativo: el correo del propio receptor sí lleva su enlace, y el patrón de celular
  // detecta un celular cuando está.
  assert.ok(c.receptor.html.includes('/mi-solicitud/'))
  assert.ok(celular.test(`Celular: ${CELULAR}`))
})

/* ─── e) Colores alineados con la web ─── */

/** Variables `--x: valor` del bloque `:root` (el primero, no `.dark`). */
function tokensRaiz(css: string): Map<string, string> {
  const inicio = css.search(/^:root\s*\{/m)
  assert.ok(inicio >= 0, 'globals.css sin bloque :root')
  const bloque = css.slice(inicio, css.indexOf('}', inicio))
  const mapa = new Map<string, string>()
  for (const [, k, v] of bloque.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))
    mapa.set(k!, v!.trim().toLowerCase())
  return mapa
}
const GLOBALS = new URL('../../web/src/app/globals.css', import.meta.url)

test('e) cada color del correo tiene el mismo hex que su token en globals.css (:root)', () => {
  const tokens = tokensRaiz(readFileSync(GLOBALS, 'utf8'))
  for (const [clave, hex] of Object.entries(COLORES)) {
    assert.ok(tokens.has(clave), `globals.css no define --${clave}`)
    assert.equal(hex.toLowerCase(), tokens.get(clave), `--${clave} desalineado`)
  }
  // Control negativo: se leyó :root y no .dark (allí --background es #0a0a0a).
  assert.equal(tokens.get('background'), '#f8f7f4')
  assert.ok(tokens.size >= Object.keys(COLORES).length)
})

/* ─── f) Contraste WCAG AA ─── */

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

test('f) los pares de texto de la plantilla cumplen AA (≥ 4.5:1)', () => {
  const C = COLORES
  const BLANCO = '#ffffff'
  const pares: [string, string, string][] = [
    ['blanco sobre primary-strong (botón)', BLANCO, C['primary-strong']],
    ['foreground sobre card', C.foreground, C.card],
    ['foreground sobre background (ficha)', C.foreground, C.background],
    ['muted-foreground sobre card', C['muted-foreground'], C.card],
    ['muted-foreground sobre background (clave de ficha)', C['muted-foreground'], C.background],
    ['attention sobre attention-soft', C.attention, C['attention-soft']],
    ['destructive-strong sobre destructive-soft', C['destructive-strong'], C['destructive-soft']],
    ['success sobre success-soft', C.success, C['success-soft']],
    ['foreground sobre primary-soft (nota info)', C.foreground, C['primary-soft']],
    ['primary-strong sobre card (etiqueta y enlace de respaldo)', C['primary-strong'], C.card],
    ['muted sobre foreground (subtítulo de cabecera)', C.muted, C.foreground],
    ['blanco sobre foreground (cabecera)', BLANCO, C.foreground],
  ]
  for (const [nombre, texto, fondo] of pares) {
    const r = contraste(texto, fondo)
    assert.ok(r >= 4.5, `${nombre}: ${r.toFixed(2)}:1`)
  }
  // Control negativo: la fórmula da los extremos conocidos y reprueba un par que sabemos flojo
  // (el --primary claro de la web sobre blanco, por eso el botón usa primary-strong).
  assert.equal(contraste('#000000', BLANCO).toFixed(0), '21')
  assert.equal(contraste(BLANCO, BLANCO), 1)
  assert.ok(contraste('#7c9082', BLANCO) < 4.5)
})

/* ─── g) Fechas ─── */

test('g) fechaLarga y franja en español, sin depender de la zona del servidor', () => {
  assert.equal(fechaLarga('2026-09-15T10:00:00-05:00'), 'martes 15 de septiembre de 2026')
  // 23:30 en Bogotá ya es el día siguiente en UTC: debe seguir siendo el 15.
  assert.equal(fechaLarga('2026-09-15T23:30:00-05:00'), 'martes 15 de septiembre de 2026')
  assert.equal(fechaLarga('2026-01-01T08:00:00-05:00'), 'jueves 1 de enero de 2026')
  assert.equal(franja('2026-09-15T10:00:00-05:00', '2026-09-15T12:30:00-05:00'), '10:00 a 12:30')
  assert.equal(
    franja('2026-09-15T18:00:00-05:00', '2026-09-16T02:00:00-05:00'),
    '18:00 del martes 15 de septiembre de 2026 a 02:00 del miércoles 16 de septiembre de 2026',
  )
})

/* ─── h) Texto plano ─── */

test('h) la versión en texto plano no lleva etiquetas HTML', () => {
  const etiqueta = /<\/?[a-z][^>]*>/i
  for (const [nombre, m] of Object.entries(
    todos(evento(), constancia(), 'Falta el aforo.', 'Laura Pérez'),
  )) {
    assert.ok(!etiqueta.test(m.texto), `${nombre}: ${m.texto.match(etiqueta)?.[0]}`)
    // Control negativo: el HTML sí las tiene, y el texto sí lleva el contenido.
    assert.ok(etiqueta.test(m.html))
    assert.ok(m.texto.includes('Conversatorio de investigación'), nombre)
  }
  // textoPlano no escapa: es texto, no HTML. Lo que escriba el usuario llega tal cual (correcto
  // en la parte text/plain del mensaje, que ningún cliente interpreta como marcado).
  assert.ok(
    textoPlano({
      preheader: '',
      etiqueta: '',
      titulo: 'a < b',
      parrafos: [],
      ficha: [],
      logoUrl: '',
    }).includes('a < b'),
  )
})
