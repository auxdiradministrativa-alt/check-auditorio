import { expect, test, type Page } from '@playwright/test'
import {
  ENTREGADOR,
  INTRUSO,
  SOLICITANTE,
  foto,
  franjaDeHoy,
  franjaLejana,
  ingresar,
  navegador,
  sinDesborde,
} from './apoyo'

async function crearEntrega(entrega: Page, evento: string, franja = franjaDeHoy(10, 30)) {
  await entrega.goto('/')
  await ingresar(entrega, ENTREGADOR)
  const operacion = entrega.getByRole('region', { name: 'Entrega de espacios' })
  await operacion.getByRole('button', { name: 'Crear entrega' }).click()
  await operacion.getByLabel('Correo de quien recibe').fill(SOLICITANTE.correo)
  await operacion.getByLabel('Evento o actividad').fill(evento)
  await operacion.getByLabel('Fecha de la entrega').fill(franja.fecha)
  await operacion.getByLabel('Hora de inicio').fill(franja.inicio)
  await operacion.getByLabel('Hora de fin').fill(franja.fin)
  await operacion.getByRole('button', { name: 'Crear entrega', exact: true }).click()
  await expect(entrega).toHaveURL(/\/panel\?evento=[0-9a-f-]{36}#operacion$/)
  const enlace = (await operacion
    .getByRole('link', { name: 'Abrir enlace', exact: true })
    .getAttribute('href'))!
  return { id: new URL(entrega.url()).searchParams.get('evento')!, enlace }
}

test('entrega directa: identidad, acta con novedad, firma y devolución', async ({
  browser,
}, testInfo) => {
  const entrega = await navegador(browser)
  const recibe = await navegador(browser)
  const intruso = await navegador(browser)
  await recibe.setViewportSize({ width: 320, height: 900 })
  const evento = `Grados ${Date.now()}`
  const { id, enlace } = await crearEntrega(entrega, evento)
  let consecutivo = ''
  async function revisarVista(nombre: string, pagina = recibe) {
    expect(await sinDesborde(pagina)).toBe(true)
    await pagina.screenshot({ path: testInfo.outputPath(`${nombre}.png`), fullPage: true })
  }
  await recibe.goto(enlace)
  await expect(recibe.getByText(evento)).toHaveCount(0)
  await intruso.goto(enlace)
  await ingresar(intruso, INTRUSO)
  await expect(intruso.getByRole('heading', { name: 'Este enlace es personal' })).toBeVisible()
  await expect(intruso.getByText(evento)).toHaveCount(0)
  await ingresar(recibe, SOLICITANTE)
  await expect(recibe.getByRole('heading', { name: 'Recepción del espacio' })).toBeVisible()
  await expect(recibe.getByText(evento)).toBeVisible()
  await revisarVista('recepcion-directa')
  await recibe.getByRole('button', { name: 'Comenzar recepción' }).click()
  await recibe.getByText('Docente', { exact: true }).click()
  await recibe.getByLabel('Dependencia o programa').fill('Contaduría Pública')
  await recibe.getByLabel('Celular').fill('3001234567')
  await recibe.getByLabel('Asistentes estimados').fill('80')
  await recibe.getByRole('button', { name: 'Continuar' }).click()
  await expect(recibe.getByRole('heading', { name: 'Estado del auditorio' })).toBeVisible()
  await test.step('Checklist: las reglas se cumplen y el atajo respeta la novedad', async () => {
    const sillas = recibe.locator('#item-as-sillas')

    // Solo aspectos de infraestructura: nada de equipos ni cantidades.
    await expect(recibe.getByText('0 de 10 revisados')).toBeVisible()
    await expect(recibe.getByText('Micrófono')).toHaveCount(0)
    await expect(sillas.getByRole('button', { name: 'Restar uno' })).toHaveCount(0)

    // Sin marcar → rechazado.
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(sillas.getByRole('alert')).toContainText('Marca si está conforme o con novedad.')

    // NOVEDAD sin observación ni foto → rechazado.
    await sillas.getByText('Novedad', { exact: true }).click()
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(sillas.getByText('Describe la novedad.')).toBeVisible()
    await expect(sillas.getByText('Adjunta al menos una foto de la novedad.')).toBeVisible()

    await sillas
      .getByLabel('¿Qué novedad encontraste?')
      .fill('Tres sillas de la fila 4 con el espaldar roto.')
    await sillas.locator('input[type=file]').setInputFiles(await foto(recibe))
    await expect(sillas.getByRole('img', { name: 'Foto: novedad.png' })).toBeVisible()
    await expect(sillas.getByLabel('Subiendo foto')).toHaveCount(0)

    // «Todo en buen estado» marca el resto sin pisar la novedad.
    await recibe.getByRole('button', { name: 'Todo en buen estado' }).click()
    await expect(
      recibe.getByRole('status').filter({ hasText: 'conservamos 1 con novedad' }),
    ).toBeVisible()
    await expect(sillas.getByLabel('¿Qué novedad encontraste?')).toHaveValue(
      'Tres sillas de la fila 4 con el espaldar roto.',
    )
    await expect(recibe.getByText('10 de 10 revisados')).toBeVisible()
    await revisarVista('checklist-atajo')
    await recibe.getByRole('button', { name: 'Continuar' }).click()
  })

  await test.step('Términos y autorización: casillas separadas y sin marcar', async () => {
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

  await test.step('El servidor sella la constancia y se verifica íntegra', async () => {
    await expect(recibe.getByText('9 conformes · 1 con novedad')).toBeVisible()
    await recibe.getByRole('button', { name: 'Firmar acta de recepción' }).click()
    await expect(recibe).toHaveURL(/\/r\/[\w-]+\/confirmada$/)
    await expect(recibe.getByRole('heading', { name: 'Recepción confirmada' })).toBeVisible()
    consecutivo = (await recibe.getByText(/^REC-\d{6}$/).textContent())!
    expect(consecutivo).toMatch(/^REC-\d{6}$/)
    await revisarVista('recepcion-confirmada')

    await recibe.getByRole('link', { name: 'Ver constancia' }).click()
    await expect(recibe).toHaveURL(new RegExp(`/verificar/${consecutivo}$`))
    await expect(recibe.getByRole('heading', { name: 'Constancia íntegra' })).toBeVisible()
    await expect(recibe.getByText(`${SOLICITANTE.nombre} (${SOLICITANTE.correo})`)).toBeVisible()
    await expect(recibe.locator('li', { hasText: 'Sillas y mobiliario' })).toContainText('Novedad')
    await expect(recibe.getByRole('heading', { level: 1 })).toHaveCSS('font-size', '28px')
    await revisarVista('constancia')
  })

  await test.step('Infraestructura ve la recepción; el enlace ya no sirve a nadie más', async () => {
    await entrega.reload()
    await expect(
      entrega.locator('#operacion').getByText(consecutivo, { exact: true }),
    ).toBeVisible()
    await expect(entrega.getByText('Constancia de recepción')).toBeVisible()
    await expect(entrega.getByRole('img', { name: /Código QR/ })).toHaveCount(0)

    await intruso.goto(enlace)
    await expect(intruso.getByRole('heading', { name: 'Este enlace es personal' })).toBeVisible()
    await recibe.goto(enlace)
    await expect(recibe).toHaveURL(/\/confirmada$/)
  })

  let enlaceDevolucion = ''
  await test.step('El enlace estable de los correos lleva a la devolución', async () => {
    await recibe.goto(`/mi-entrega/${id}`)
    await expect(recibe).toHaveURL(/\/devolucion\/[0-9a-f-]{36}\?t=/)
    enlaceDevolucion = recibe.url()
    await intruso.goto(`/mi-entrega/${id}`)
    await expect(intruso.getByRole('heading', { name: 'Este enlace es personal' })).toBeVisible()
  })

  await test.step('Solo quien recibió declara la devolución, con novedad y foto', async () => {
    await intruso.goto(enlaceDevolucion)
    await expect(intruso.getByRole('button', { name: 'Declarar devolución' })).toHaveCount(0)

    await revisarVista('devolucion')
    await recibe.getByRole('button', { name: 'Declarar devolución' }).click()
    await expect(recibe.getByText('• Debes confirmar la declaración.')).toBeVisible()
    await recibe.getByText('Con novedades', { exact: true }).click()
    await recibe.getByRole('checkbox', { name: 'Muros y pintura' }).check()
    await recibe
      .getByLabel('Novedad de Muros y pintura')
      .fill('Quedó una mancha de cinta en el muro del escenario.')
    await recibe.locator('input[type=file]').setInputFiles(await foto(recibe))
    await expect(recibe.getByRole('img', { name: 'Foto: novedad.png' })).toBeVisible()
    await expect(recibe.getByLabel('Subiendo foto')).toHaveCount(0)
    await recibe.getByLabel(/Declaro que la información es verdadera/).check()
    await recibe.getByRole('button', { name: 'Declarar devolución' }).click()
    await expect(recibe.getByRole('heading', { name: 'Devolución registrada' })).toBeVisible()
  })

  await test.step('Cierre: Devuelta, devolución en la constancia y sin doble declaración', async () => {
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

test('entrega futura: muestra el acta y explica cuándo se puede comenzar', async ({ browser }) => {
  const entrega = await navegador(browser)
  const recibe = await navegador(browser)
  const { enlace } = await crearEntrega(entrega, `Consejo ${Date.now()}`, franjaLejana())
  await recibe.goto(enlace)
  await ingresar(recibe, SOLICITANTE)
  await expect(recibe.getByRole('heading', { name: 'Recepción del espacio' })).toBeVisible()
  await expect(recibe.getByText(/Podrás comenzar la recepción el/)).toBeVisible()
  await expect(recibe.getByRole('button', { name: 'Comenzar recepción' })).toBeDisabled()
})
