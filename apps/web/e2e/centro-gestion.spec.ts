import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

import { ENTREGADOR, franjaLejana, ingresar, sinDesborde } from './apoyo'

test('gestión por enlace: emitir, compartir, filtros locales, exportación y anulación', async ({
  page,
}, testInfo) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  // Empieza por «=»: el CSV debe neutralizarlo para que Excel no lo ejecute como fórmula.
  const evento = `=Encuentro académico de investigación y planeación institucional con docentes y administrativos ${Date.now()}`
  const correo = `docente.${Date.now().toString(36)}@americana.edu.co`
  await page.goto('/')
  await ingresar(page, ENTREGADOR)
  await expect(page.getByRole('heading', { name: 'Entrega de espacios', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hoy', exact: true })).toHaveCount(0)

  const operacion = page.getByRole('region', { name: 'Entrega de espacios' })
  await operacion.getByRole('button', { name: 'Crear entrega' }).click()
  const campoCorreo = operacion.getByLabel('Correo de quien recibe')

  const franja = franjaLejana()
  await operacion.getByLabel('Evento o actividad').fill(evento)
  await operacion.getByLabel('Fecha de la entrega').fill(franja.fecha)
  await operacion.getByLabel('Hora de inicio').fill(franja.inicio)
  await operacion.getByLabel('Hora de fin').fill(franja.fin)
  // Solo cuentas del dominio: el enlace se amarra a una cuenta institucional.
  await campoCorreo.fill('alguien@gmail.com')
  await operacion.getByRole('button', { name: 'Crear entrega' }).click()
  await expect(operacion.getByText('El correo debe ser @americana.edu.co.')).toBeVisible()
  await expect(campoCorreo).toHaveAttribute('aria-invalid', 'true')

  await campoCorreo.fill(correo)
  await operacion.getByLabel('Evento o actividad').fill(evento)
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await sinDesborde(page)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`formulario-${width}.png`), fullPage: true })
  }
  await operacion.getByRole('button', { name: 'Crear entrega' }).click()
  await expect(
    operacion.getByRole('img', { name: `Código QR del enlace para ${correo}` }),
  ).toBeVisible()
  const id = new URL(page.url()).searchParams.get('evento')!
  expect(id).toMatch(/^[0-9a-f-]{36}$/)
  const titulo = operacion.getByRole('heading', { name: 'Enlace y QR de recepción' })
  await expect(titulo).toHaveCSS('font-size', '16px')
  await expect(titulo).toHaveCSS('font-weight', '600')
  // La entrega nace con su franja: «Por definir» queda solo para invitaciones históricas.
  await expect(operacion.getByText('Por definir')).toHaveCount(0)
  await expect(operacion.getByText('Entrega programada', { exact: true })).toBeVisible()

  const qrDescarga = page.waitForEvent('download')
  await operacion.getByRole('button', { name: 'Descargar QR' }).click()
  const qr = await qrDescarga
  expect(await readFile((await qr.path())!, 'utf8')).toContain('<svg')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await operacion.getByRole('button', { name: 'Copiar enlace' }).click()
  await expect(operacion.getByRole('status')).toContainText('Enlace copiado')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('/r/')
  await operacion.getByRole('button', { name: 'Copiar mensaje' }).click()
  await expect(operacion.getByRole('status')).toContainText('Mensaje copiado')
  const mensaje = await page.evaluate(() => navigator.clipboard.readText())
  expect(mensaje).toContain(correo)
  expect(mensaje).toMatch(/Disponible desde .+ hasta .+\./)
  expect(mensaje).toContain('/r/')

  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await sinDesborde(page)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`detalle-${width}.png`), fullPage: true })
  }

  await operacion.getByRole('link', { name: 'Cerrar detalle' }).click()
  // La lista ya está visible antes de terminar esta navegación. Esperar su cierre
  // evita contar la petición de navegación como si la hubieran causado los filtros.
  await expect(page).toHaveURL(/\/panel#entregas$/)
  await expect(operacion.getByRole('link', { name: 'Cerrar detalle' })).toHaveCount(0)
  const entregas = page.getByRole('region', { name: 'Entregas y seguimiento' })
  const historico = page.getByRole('region', { name: 'Registro histórico y constancias' })
  const fila = entregas.getByRole('row').filter({ hasText: evento })
  await expect(fila.getByRole('link', { name: evento, exact: true })).toBeVisible()
  await expect(fila.getByText('Por definir')).toHaveCount(0)
  await expect(fila.getByText('Entrega programada', { exact: true })).toBeVisible()
  await expect(fila.getByRole('link', { name: 'Abrir QR' })).toBeVisible()

  const lecturas: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('_rsc=')) lecturas.push(request.url())
  })
  const inicioFiltro = Date.now()
  await page.getByRole('searchbox').fill('no existe este evento')
  await expect(entregas.getByText('No hay eventos que coincidan')).toBeVisible()
  // La búsqueda también encuentra por el correo al que se emitió el enlace.
  await page.getByRole('searchbox').fill(correo)
  await expect(entregas.getByRole('link', { name: evento, exact: true })).toBeVisible()
  await page.getByRole('searchbox').fill('encuentro academico')
  await expect(entregas.getByRole('link', { name: evento, exact: true })).toBeVisible()
  expect(lecturas).toHaveLength(0)
  await testInfo.attach('filtros-locales', {
    body: JSON.stringify({
      duracionTresFiltrosMs: Date.now() - inicioFiltro,
      solicitudesRsc: lecturas.length,
    }),
    contentType: 'application/json',
  })

  // Los estados nuevos se filtran con su nombre para el gestor.
  const estado = page.getByRole('combobox', { name: /^Estado/ })
  await estado.selectOption({ label: 'Recibida' })
  await expect(entregas.getByRole('link', { name: evento, exact: true })).toHaveCount(0)
  await estado.selectOption({ label: 'Entrega programada' })
  await expect(entregas.getByRole('link', { name: evento, exact: true })).toBeVisible()

  const hoy = franja.fecha
  await page.getByLabel('Desde', { exact: true }).fill(hoy)
  await page.getByLabel('Hasta', { exact: true }).fill(hoy)
  await expect(entregas.getByRole('link', { name: evento, exact: true })).toBeVisible()
  const csvDescarga = page.waitForEvent('download')
  await historico.getByRole('button', { name: 'Exportar CSV' }).click()
  const csv = await readFile((await (await csvDescarga).path())!, 'utf8')
  const lineaCsv = csv.split('\n').find((l) => l.includes(evento))!
  expect(lineaCsv).toContain(`"'${evento}"`)
  expect(lineaCsv).toContain(franja.fecha)
  expect(lineaCsv).toContain('Entrega programada')
  await historico.getByLabel('Solo recepciones con constancia').check()
  await expect(historico.getByRole('link', { name: evento, exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()

  await page.screenshot({ path: testInfo.outputPath('gestion-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(operacion.getByRole('button', { name: 'Crear entrega' })).toBeVisible()
  expect(await sinDesborde(page)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('gestion-mobile.png'), fullPage: true })

  // Enlaces anteriores siguen abriendo la misma gestión, sin interfaces duplicadas.
  await page.goto(`/panel/asignaciones/${id}`)
  await expect(page).toHaveURL(new RegExp(`/panel\\?evento=${id}#operacion$`))
  page.once('dialog', (dialog) => dialog.accept())
  await operacion.getByRole('button', { name: 'Anular entrega' }).click()
  await expect(operacion.getByText('Anulada', { exact: true })).toBeVisible()
  await expect(operacion.getByRole('img', { name: /Código QR/ })).toHaveCount(0)
  await expect(entregas.getByRole('link', { name: evento, exact: true })).toHaveCount(0)
  await expect(historico.getByRole('link', { name: evento, exact: true })).toBeVisible()
  await page.goto('/panel/recepciones')
  await expect(page).toHaveURL(/\/panel#historico$/)
  await page.goto('/panel/asignaciones')
  await expect(page).toHaveURL(/\/panel#entregas$/)
  await page.goto('/panel/asignaciones/nueva')
  await expect(operacion.getByLabel('Correo de quien recibe')).toBeVisible()
  expect(errores).toEqual([])
})
