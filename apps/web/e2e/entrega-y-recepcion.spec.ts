import { expect, test, type Browser, type Page } from '@playwright/test'

/*
 * Prueba de uso: Infraestructura entrega el auditorio y un docente lo recibe y lo devuelve.
 * Tres navegadores independientes (cookies separadas), como tres celulares distintos.
 */

const ENTREGADOR = { nombre: 'Infraestructura', correo: 'auxdiradministrativa@americana.edu.co' }
const RECEPTOR = { nombre: 'Laura Pérez Gómez', correo: 'laura.perez@americana.edu.co' }
const INTRUSO = { nombre: 'Carlos Ruiz Díaz', correo: 'carlos.ruiz@americana.edu.co' }

type Cuenta = { nombre: string; correo: string }

/** Fecha y hora actuales en Bogotá, redondeadas a 5 minutos (el campo de hora usa step=300). */
function franjaQueEmpiezaYa() {
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
  const minutosInicio = Math.floor((Number(partes.hour) * 60 + Number(partes.minute)) / 5) * 5
  const minutosFin = Math.min(minutosInicio + 120, 23 * 60 + 55)
  const hhmm = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  if (minutosFin <= minutosInicio) throw new Error('Corre la prueba antes de las 23:55 de Bogotá.')
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    inicio: hhmm(minutosInicio),
    fin: hhmm(minutosFin),
  }
}

async function navegador(browser: Browser) {
  const contexto = await browser.newContext()
  return contexto.newPage()
}

async function ingresar(page: Page, cuenta: Cuenta) {
  await page.getByLabel('Nombre').fill(cuenta.nombre)
  await page.getByLabel('Correo institucional').fill(cuenta.correo)
  await page.getByRole('button', { name: 'Ingresar (modo local)' }).click()
}

/** Una imagen PNG real (captura de la propia página) para simular la foto del celular. */
async function foto(page: Page) {
  return {
    name: 'novedad.png',
    mimeType: 'image/png',
    buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 320, height: 240 } }),
  }
}

test.describe('Ingreso', () => {
  test('rechaza cuentas fuera del dominio institucional', async ({ page }) => {
    await page.goto('/')
    await ingresar(page, { nombre: 'Persona Externa', correo: 'alguien@gmail.com' })
    await expect(page.getByText('Solo cuentas @americana.edu.co.')).toBeVisible()
    await page.goto('/panel')
    await expect(page).toHaveURL(/\/\?destino=%2Fpanel$/)
  })

  test('una cuenta institucional no autorizada no entra al panel', async ({ page }) => {
    await page.goto('/')
    await ingresar(page, INTRUSO)
    await expect(page.getByText('esta cuenta no está autorizada para el panel')).toBeVisible()
    await page.goto('/panel/asignaciones/nueva')
    await expect(page).not.toHaveURL(/\/panel/)
  })
})

test('entrega, recepción con novedad, verificación y devolución', async ({ browser }) => {
  const evento = `Foro de Investigación ${Date.now().toString(36)}`
  const entrega = await navegador(browser)
  const recibe = await navegador(browser)
  const intruso = await navegador(browser)
  let enlaceQr = ''
  let consecutivo = ''

  await test.step('Infraestructura ingresa y programa la entrega', async () => {
    await entrega.goto('/')
    await ingresar(entrega, ENTREGADOR)
    await expect(entrega).toHaveURL(/\/panel$/)

    await entrega.goto('/panel/asignaciones/nueva')
    const franja = franjaQueEmpiezaYa()
    await entrega.getByLabel('Evento o actividad').fill(evento)
    await entrega.getByLabel('Fecha').fill(franja.fecha)
    await entrega.getByLabel('Hora de inicio').fill(franja.inicio)
    await entrega.getByLabel('Hora de fin').fill(franja.fin)
    await entrega.getByRole('button', { name: 'Programar y generar QR' }).click()

    await expect(entrega).toHaveURL(/\/panel\/asignaciones\/[0-9a-f-]{36}$/)
    await expect(entrega.getByRole('heading', { level: 1 })).toHaveText(evento)
    await expect(
      entrega.getByRole('img', { name: `Código QR para recibir ${evento}` }),
    ).toBeVisible()
    enlaceQr = (await entrega
      .getByRole('link', { name: 'Abrir enlace de recepción' })
      .getAttribute('href'))!
    expect(enlaceQr).toMatch(/^http:\/\/localhost:3100\/r\/[\w-]+$/)
  })

  await test.step('El docente escanea el QR, se identifica y solicita', async () => {
    await recibe.goto(enlaceQr)
    await expect(recibe.getByRole('heading', { name: 'Identifícate para recibir' })).toBeVisible()
    await ingresar(recibe, RECEPTOR)
    await expect(recibe.getByRole('heading', { name: 'Confirma quién recibe' })).toBeVisible()
    await recibe.getByRole('button', { name: 'Soy yo, solicitar recepción' }).click()
    await expect(recibe.getByRole('heading', { name: 'Esperando validación' })).toBeVisible()
  })

  await test.step('Otra cuenta que escanea el mismo QR no puede usarlo', async () => {
    await intruso.goto('/')
    await ingresar(intruso, INTRUSO)
    await expect(intruso.getByText('esta cuenta no está autorizada para el panel')).toBeVisible()
    await intruso.goto(enlaceQr)
    await expect(intruso.getByRole('heading', { name: 'Este QR ya no está vigente' })).toBeVisible()
  })

  await test.step('Infraestructura confirma la identidad en su panel', async () => {
    await expect(entrega.getByText('¿Es la persona que tienes en frente?')).toBeVisible()
    await expect(entrega.getByText(RECEPTOR.correo)).toBeVisible()
    await entrega.getByRole('button', { name: 'Sí, confirmar' }).click()
    await expect(entrega.getByText('Diligenciando la constancia')).toBeVisible()
  })

  await test.step('El docente diligencia sus datos', async () => {
    await expect(recibe.getByRole('heading', { name: 'Recepción del espacio' })).toBeVisible()
    await expect(recibe.getByText('Identidad validada')).toBeVisible()
    await recibe.getByRole('button', { name: 'Comenzar' }).click()

    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(recibe.getByText('Selecciona tu rol.')).toBeVisible()

    await recibe.getByText('Docente', { exact: true }).click()
    await recibe.getByLabel('Dependencia o programa').fill('Contaduría Pública')
    await recibe.getByLabel('Celular').fill('3001234567')
    await recibe.getByLabel('Asistentes estimados').fill('80')
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(recibe.getByRole('heading', { name: 'Elementos que recibes' })).toBeVisible()
  })

  await test.step('Checklist: las reglas de cantidad y novedad se hacen cumplir', async () => {
    const sillas = recibe.locator('#item-el-sillas')

    // CONFORME con una cantidad distinta de la esperada → rechazado.
    await sillas.getByRole('button', { name: 'Restar uno' }).click()
    await sillas.getByText('Conforme', { exact: true }).click()
    await recibe.getByRole('button', { name: 'Marcar pendientes conformes' }).click()
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(sillas.getByRole('alert')).toContainText('La cantidad no coincide')

    // NOVEDAD sin observación ni foto → rechazado.
    await sillas.getByText('Novedad', { exact: true }).click()
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(sillas.getByText('Describe la novedad.')).toBeVisible()
    await expect(sillas.getByText('Adjunta al menos una foto de la novedad.')).toBeVisible()

    // Con observación y foto subida → pasa.
    await sillas.getByLabel('¿Qué novedad encontraste?').fill('Falta una silla; hay 149 en sala.')
    await sillas.locator('input[type=file]').setInputFiles(await foto(recibe))
    await expect(sillas.getByRole('img', { name: 'Foto: novedad.png' })).toBeVisible()
    await expect(sillas.getByLabel('Subiendo foto')).toHaveCount(0)
    await expect(recibe.getByText('6 de 6 revisados')).toBeVisible()
    await recibe.getByRole('button', { name: 'Continuar' }).click()

    await expect(recibe.getByRole('heading', { name: 'Condiciones del espacio' })).toBeVisible()
    await recibe.getByRole('button', { name: 'Marcar pendientes conformes' }).click()
    await expect(recibe.getByText('11 de 11 revisados')).toBeVisible()
    await recibe.getByRole('button', { name: 'Continuar' }).click()
  })

  await test.step('Términos y autorización de datos: casillas separadas y sin marcar', async () => {
    const acepta = recibe.getByLabel(/Leí y acepto los términos/)
    const datos = recibe.locator('#datos')
    await expect(acepta).not.toBeChecked()
    await expect(datos).not.toBeChecked()

    await acepta.check()
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(recibe.getByText(/^Debes aceptar los términos/)).toBeVisible()

    await datos.check()
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(recibe.getByRole('heading', { name: 'Revisa y envía' })).toBeVisible()
  })

  await test.step('El docente confirma y el servidor sella la constancia', async () => {
    await expect(recibe.getByText('16 conformes · 1 con novedad')).toBeVisible()
    await expect(recibe.getByText('Falta una silla; hay 149 en sala.')).toBeVisible()
    await recibe.getByRole('button', { name: 'Confirmar recepción' }).click()

    await expect(recibe).toHaveURL(/\/r\/[\w-]+\/confirmada$/)
    await expect(recibe.getByRole('heading', { name: 'Recepción confirmada' })).toBeVisible()
    consecutivo = (await recibe.getByText(/^REC-\d{6}$/).textContent())!
    expect(consecutivo).toMatch(/^REC-\d{6}$/)
  })

  await test.step('La constancia se verifica íntegra', async () => {
    await recibe.getByRole('link', { name: 'Ver constancia' }).click()
    await expect(recibe).toHaveURL(new RegExp(`/verificar/${consecutivo}$`))
    await expect(recibe.getByRole('heading', { name: 'Constancia íntegra' })).toBeVisible()
    await expect(recibe.getByText(`${RECEPTOR.nombre} (${RECEPTOR.correo})`)).toBeVisible()
    await expect(recibe.getByText('149/150 · Novedad')).toBeVisible()
    await expect(recibe.getByText('Pendiente', { exact: true })).toBeVisible()
  })

  await test.step('Infraestructura ve la recepción en su panel', async () => {
    await expect(entrega.getByText(consecutivo)).toBeVisible()
    await expect(entrega.getByText('Constancia de recepción')).toBeVisible()
    await expect(entrega.getByRole('img', { name: /Código QR/ })).toHaveCount(0)
  })

  await test.step('El QR ya usado no sirve a nadie más', async () => {
    await intruso.goto(enlaceQr)
    await expect(intruso.getByRole('heading', { name: 'Este QR ya no está vigente' })).toBeVisible()
    await recibe.goto(enlaceQr)
    await expect(recibe).toHaveURL(/\/confirmada$/)
  })

  let enlaceDevolucion = ''
  await test.step('Solo quien recibió declara la devolución, con novedad y foto', async () => {
    enlaceDevolucion = (await recibe
      .getByRole('link', { name: 'Declarar devolución' })
      .getAttribute('href'))!
    expect(enlaceDevolucion).toMatch(/\/devolucion\/[0-9a-f-]{36}\?t=/)

    // Otra cuenta con el mismo enlace → no existe para ella.
    await intruso.goto(enlaceDevolucion)
    await expect(intruso.getByRole('heading', { name: 'Declarar devolución' })).toHaveCount(0)
    await expect(intruso.getByRole('button', { name: 'Declarar devolución' })).toHaveCount(0)

    await recibe.goto(enlaceDevolucion)
    await recibe.getByRole('button', { name: 'Declarar devolución' }).click()
    await expect(recibe.getByText('• Debes confirmar la declaración.')).toBeVisible()

    await recibe.getByText('Con novedades', { exact: true }).click()
    await recibe.getByRole('checkbox', { name: 'Video beam' }).check()
    await recibe
      .getByLabel('Novedad de Video beam')
      .fill('Uno de los video beam quedó sin control.')
    await recibe.locator('input[type=file]').setInputFiles(await foto(recibe))
    await expect(recibe.getByRole('img', { name: 'Foto: novedad.png' })).toBeVisible()
    await expect(recibe.getByLabel('Subiendo foto')).toHaveCount(0)
    await recibe.getByLabel(/Declaro que la información es verdadera/).check()
    await recibe.getByRole('button', { name: 'Declarar devolución' }).click()
    await expect(recibe.getByRole('heading', { name: 'Devolución registrada' })).toBeVisible()
  })

  await test.step('Cierre: estado Devuelta, devolución en la constancia y sin doble declaración', async () => {
    await entrega.reload()
    await expect(entrega.getByText('Devuelta', { exact: true }).first()).toBeVisible()

    await entrega.goto(`/verificar/${consecutivo}`)
    await expect(entrega.getByRole('heading', { name: 'Constancia íntegra' })).toBeVisible()
    await expect(entrega.getByText(/^Con novedades · /)).toBeVisible()

    await recibe.goto(enlaceDevolucion)
    await expect(recibe.getByRole('heading', { name: 'Devolución registrada' })).toBeVisible()
    await expect(recibe.getByRole('button', { name: 'Declarar devolución' })).toHaveCount(0)
  })
})
