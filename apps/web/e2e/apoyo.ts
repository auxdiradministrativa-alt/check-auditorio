import type { Browser, Page } from '@playwright/test'

/* Cuentas, sesiones y franjas compartidas por las pruebas de uso (login local, sin Google). */

export type Cuenta = { nombre: string; correo: string }

export const ENTREGADOR = {
  nombre: 'Infraestructura',
  correo: 'auxdiradministrativa@americana.edu.co',
}
/**
 * Quien solicita recibe los correos reales cuando la prueba corre contra el Sheet (`e2e:gas`):
 * ahí es obligatorio nombrar un buzón propio, para no escribirle a una cuenta ajena del dominio.
 */
function solicitante(): Cuenta {
  const correo = process.env.E2E_CORREO_SOLICITANTE?.trim()
  if (correo) return { nombre: process.env.E2E_NOMBRE_SOLICITANTE?.trim() || correo, correo }
  if (process.env.CHECK_E2E_GAS)
    throw new Error(
      'e2e:gas envía correos reales a quien solicita: define E2E_CORREO_SOLICITANTE con tu correo @americana.edu.co.',
    )
  return { nombre: 'Laura Pérez Gómez', correo: 'laura.perez@americana.edu.co' }
}
export const SOLICITANTE = solicitante()
export const INTRUSO = { nombre: 'Carlos Ruiz Díaz', correo: 'carlos.ruiz@americana.edu.co' }

/** Un navegador con cookies propias, como un celular distinto. */
export async function navegador(browser: Browser) {
  const contexto = await browser.newContext()
  return contexto.newPage()
}

export async function ingresar(page: Page, cuenta: Cuenta) {
  await page.getByLabel('Nombre').fill(cuenta.nombre)
  await page.getByLabel('Correo institucional').fill(cuenta.correo)
  await page.getByRole('button', { name: 'Ingresar (modo local)' }).click()
}

/** Una imagen PNG real (captura de la propia página) para simular la foto del celular. */
export async function foto(page: Page) {
  return {
    name: 'novedad.png',
    mimeType: 'image/png',
    buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 320, height: 240 } }),
  }
}

/** La página no se desborda en horizontal. */
export const sinDesborde = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)

const hhmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Fecha (AAAA-MM-DD) y minutos del día, en Bogotá. */
export function ahoraBogota() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  )
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  }
}

/**
 * Franja de hoy que empieza dentro de `minutosHastaInicio` (redondeado a 5 min, porque el campo
 * de hora usa step=300). Con menos de 30 min, la recepción ya está habilitada al aprobarla.
 */
export function franjaDeHoy(minutosHastaInicio: number, duracion = 60) {
  const { fecha, minutos } = ahoraBogota()
  const inicio = Math.ceil((minutos + minutosHastaInicio) / 5) * 5
  const fin = inicio + duracion
  if (fin > 23 * 60 + 55) throw new Error('Corre la prueba antes de las 22:45 de Bogotá.')
  return { fecha, inicio: hhmm(inicio), fin: hhmm(fin) }
}

/**
 * Franja lejana y distinta en cada corrida: contra el Sheet real, una franja fija chocaría con la
 * aprobada en una corrida anterior.
 */
export function franjaLejana() {
  const t = Date.now()
  const dia = new Date(Date.UTC(2035 + (t % 5), 0, 1) + (Math.floor(t / 5) % 360) * 86_400_000)
  const inicio = 8 * 60 + (Math.floor(t / 1800) % 20) * 30
  return { fecha: dia.toISOString().slice(0, 10), inicio: hhmm(inicio), fin: hhmm(inicio + 120) }
}
