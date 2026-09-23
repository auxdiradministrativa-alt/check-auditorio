import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('gestión por reservas: evento futuro, QR, filtros locales, exportación y anulación', async ({
  page,
}, testInfo) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  const evento = `=Encuentro académico ${Date.now()}`
  await page.goto('/')
  await page.getByLabel('Nombre').fill('Infraestructura')
  await page.getByLabel('Correo institucional').fill('auxdiradministrativa@americana.edu.co')
  await page.getByRole('button', { name: 'Ingresar (modo local)' }).click()
  await expect(page.getByRole('heading', { name: 'Gestión de espacios' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hoy', exact: true })).toHaveCount(0)

  const operacion = page.getByRole('region', { name: 'Operación de eventos' })
  await operacion.getByRole('button', { name: 'Crear evento', exact: true }).click()
  await operacion.getByLabel('Evento o actividad').fill(evento)
  await operacion.getByLabel('Fecha', { exact: true }).fill('2035-06-15')
  await operacion.getByLabel('Hora de inicio').fill('09:00')
  await operacion.getByLabel('Hora de fin').fill('11:00')
  await operacion.getByRole('button', { name: 'Crear evento y generar QR' }).click()
  await expect(
    operacion.getByRole('img', { name: `Código QR para recibir ${evento}` }),
  ).toBeVisible()
  const id = new URL(page.url()).searchParams.get('evento')!
  expect(id).toMatch(/^[0-9a-f-]{36}$/)

  const qrDescarga = page.waitForEvent('download')
  await operacion.getByRole('button', { name: 'Descargar QR' }).click()
  const qr = await qrDescarga
  expect(await readFile((await qr.path())!, 'utf8')).toContain('<svg')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await operacion.getByRole('button', { name: 'Copiar enlace' }).click()
  await expect(operacion.getByRole('status')).toContainText('Enlace copiado')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('/r/')

  await operacion.getByRole('link', { name: 'Cerrar detalle' }).click()
  const reservas = page.getByRole('region', { name: 'Reservas y seguimiento' })
  const historico = page.getByRole('region', { name: 'Registro histórico y constancias' })
  await expect(reservas.getByRole('link', { name: evento, exact: true })).toBeVisible()

  const lecturas: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('_rsc=')) lecturas.push(request.url())
  })
  const inicioFiltro = Date.now()
  await page.getByRole('searchbox').fill('no existe este evento')
  await expect(reservas.getByText('No hay eventos que coincidan')).toBeVisible()
  await page.getByRole('searchbox').fill('encuentro academico')
  await expect(reservas.getByRole('link', { name: evento, exact: true })).toBeVisible()
  expect(lecturas).toHaveLength(0)
  await testInfo.attach('filtros-locales', {
    body: JSON.stringify({
      duracionDosFiltrosMs: Date.now() - inicioFiltro,
      solicitudesRsc: lecturas.length,
    }),
    contentType: 'application/json',
  })
  await page.getByLabel('Desde', { exact: true }).fill('2035-06-15')
  await page.getByLabel('Hasta', { exact: true }).fill('2035-06-15')
  await expect(reservas.getByRole('link', { name: evento, exact: true })).toBeVisible()
  const csvDescarga = page.waitForEvent('download')
  await historico.getByRole('button', { name: 'Exportar CSV' }).click()
  const csv = await csvDescarga
  expect(await readFile((await csv.path())!, 'utf8')).toContain(`"'${evento}"`)
  await historico.getByLabel('Solo recepciones con constancia').check()
  await expect(historico.getByRole('link', { name: evento, exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()

  await page.screenshot({ path: testInfo.outputPath('gestion-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Crear evento', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: testInfo.outputPath('gestion-mobile.png'), fullPage: true })

  // Enlaces anteriores siguen abriendo la misma gestión, sin interfaces duplicadas.
  await page.goto(`/panel/asignaciones/${id}`)
  await expect(page).toHaveURL(new RegExp(`/panel\\?evento=${id}#operacion$`))
  page.once('dialog', (dialog) => dialog.accept())
  await operacion.getByRole('button', { name: 'Anular asignación' }).click()
  await expect(operacion.getByText('Anulada', { exact: true })).toBeVisible()
  await expect(operacion.getByRole('img', { name: /Código QR/ })).toHaveCount(0)
  await expect(reservas.getByRole('link', { name: evento, exact: true })).toHaveCount(0)
  await expect(historico.getByRole('link', { name: evento, exact: true })).toBeVisible()
  await page.goto('/panel/recepciones')
  await expect(page).toHaveURL(/\/panel#historico$/)
  await page.goto('/panel/asignaciones')
  await expect(page).toHaveURL(/\/panel#reservas$/)
  await page.goto('/panel/asignaciones/nueva')
  await expect(operacion.getByLabel('Evento o actividad')).toBeVisible()
  expect(errores).toEqual([])
})
