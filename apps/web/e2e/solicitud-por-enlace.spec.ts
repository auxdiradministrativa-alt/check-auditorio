import { randomUUID } from 'node:crypto'
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

/*
 * Flujo por solicitud con enlace personal (spec 2026-09-23): Infraestructura emite el enlace, quien
 * solicita lo diligencia, Infraestructura lo devuelve o lo aprueba, y quien solicitó confirma la
 * recepción, la sella y declara la devolución. Tres navegadores con cookies separadas.
 */

/** Infraestructura emite un enlace para `correo` y devuelve su id y la URL personal. */
async function emitirEnlace(entrega: Page, correo: string, referencia: string) {
  await entrega.goto('/')
  await ingresar(entrega, ENTREGADOR)
  await expect(entrega).toHaveURL(/\/panel$/)
  const operacion = entrega.getByRole('region', { name: 'Operación de eventos' })
  await operacion.getByRole('button', { name: 'Emitir enlace' }).click()
  await operacion.getByLabel('Correo de quien solicita').fill(correo)
  await operacion.getByLabel('Referencia').fill(referencia)
  await operacion.getByRole('button', { name: 'Emitir enlace' }).click()
  await expect(entrega).toHaveURL(/\/panel\?evento=[0-9a-f-]{36}#operacion$/)
  await expect(
    operacion.getByRole('img', { name: `Código QR del enlace para ${correo}` }),
  ).toBeVisible()
  const enlace = (await operacion.getByRole('link', { name: 'Abrir enlace' }).getAttribute('href'))!
  expect(enlace).toMatch(/^http:\/\/localhost:3100\/r\/[\w-]+$/)
  return { id: new URL(entrega.url()).searchParams.get('evento')!, enlace, operacion }
}

/** Diligencia el formulario de solicitud (el de corrección trae los datos precargados). */
async function diligenciar(
  page: Page,
  franja: { fecha: string; inicio: string; fin: string },
  evento?: string,
) {
  if (evento) await page.getByLabel('Evento o actividad').fill(evento)
  await page.getByLabel('Fecha').fill(franja.fecha)
  await page.getByLabel('Hora de inicio').fill(franja.inicio)
  await page.getByLabel('Hora de fin').fill(franja.fin)
}

test('solicitud por enlace: devolver, corregir, aprobar, confirmar, sellar y devolver', async ({
  browser,
}, testInfo) => {
  const sufijo = Date.now().toString(36)
  const referencia = `Foro ${sufijo}`
  const evento = `Foro de Investigación Contable ${sufijo}`
  const entrega = await navegador(browser)
  const recibe = await navegador(browser)
  const intruso = await navegador(browser)
  await recibe.setViewportSize({ width: 320, height: 900 })
  async function revisarVista(nombre: string, pagina = recibe) {
    expect(await sinDesborde(pagina)).toBe(true)
    await pagina.screenshot({ path: testInfo.outputPath(`${nombre}.png`), fullPage: true })
  }
  let id = ''
  let enlace = ''
  let consecutivo = ''

  await test.step('Infraestructura emite el enlace personal', async () => {
    ;({ id, enlace } = await emitirEnlace(entrega, SOLICITANTE.correo, referencia))
    await expect(entrega.getByText('Por diligenciar', { exact: true }).first()).toBeVisible()
    await expect(entrega.getByText(/^• Vence el .+ si no se diligencia\.$/)).toBeVisible()
  })

  await test.step('Sin sesión el enlace no muestra nada del evento', async () => {
    await recibe.goto(enlace)
    await expect(recibe.getByRole('heading', { name: 'Identifícate para continuar' })).toBeVisible()
    await expect(recibe.getByText(referencia)).toHaveCount(0)
    await revisarVista('enlace-sin-sesion')
  })

  await test.step('Otra cuenta con el mismo enlace ve solo que es personal', async () => {
    await intruso.goto('/')
    await ingresar(intruso, INTRUSO)
    await expect(intruso.getByText('esta cuenta no está autorizada para el panel')).toBeVisible()
    await intruso.goto(enlace)
    await expect(intruso.getByRole('heading', { name: 'Este enlace es personal' })).toBeVisible()
    await expect(intruso.getByText(referencia)).toHaveCount(0)
    await expect(intruso.getByText(SOLICITANTE.correo)).toHaveCount(0)
    await expect(intruso.getByRole('button', { name: 'Entrar con otra cuenta' })).toBeVisible()
  })

  await test.step('Quien solicita diligencia: el formulario exige sus datos y la autorización', async () => {
    await ingresar(recibe, SOLICITANTE)
    await expect(recibe.getByRole('heading', { name: 'Solicita el espacio' })).toBeVisible()
    await expect(recibe.getByLabel('Evento o actividad')).toHaveValue(referencia)
    await revisarVista('solicitud-vacia')

    await recibe.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(recibe.getByText('Selecciona la fecha.')).toBeVisible()
    await expect(recibe.getByText('Selecciona tu rol.')).toBeVisible()
    await expect(recibe.getByText('Debes autorizar el tratamiento de datos.')).toBeVisible()

    // Primera propuesta, en una fecha lejana: Infraestructura la devolverá.
    await diligenciar(recibe, franjaLejana(), evento)
    await recibe.getByText('Docente', { exact: true }).click()
    await recibe.getByLabel('Dependencia o programa').fill('Contaduría Pública')
    await recibe.getByLabel('Celular').fill('3001234567')
    await recibe.getByLabel('Asistentes estimados').fill('80')
    await expect(recibe.locator('#autorizaDatos')).not.toBeChecked()
    await recibe.locator('#autorizaDatos').check()
    await recibe.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(recibe.getByRole('heading', { name: 'Solicitud en revisión' })).toBeVisible()
    await revisarVista('solicitud-en-revision')
  })

  await test.step('Infraestructura la devuelve con un motivo que se exige', async () => {
    await entrega.reload()
    await expect(
      entrega.getByRole('heading', { name: '¿Apruebas esta reserva del espacio?' }),
    ).toBeVisible()
    await expect(entrega.getByRole('heading', { name: evento, exact: true })).toBeVisible()
    await entrega.getByRole('button', { name: 'Devolver para corregir' }).click()
    await entrega.getByLabel('Qué debe corregir').fill('no')
    await entrega.getByRole('button', { name: 'Enviar devolución' }).click()
    await expect(entrega.getByText(/^Explica qué debe corregir/)).toBeVisible()
    await entrega
      .getByLabel('Qué debe corregir')
      .fill('El auditorio está ocupado esa fecha. Propón hoy.')
    await entrega.getByRole('button', { name: 'Enviar devolución' }).click()
    await expect(entrega.getByRole('heading', { name: 'Devuelta para corregir' })).toBeVisible()
  })

  await test.step('Quien solicita ve el motivo y corrige sin volver a escribir sus datos', async () => {
    await recibe.reload()
    await expect(recibe.getByRole('heading', { name: 'Corrige tu solicitud' })).toBeVisible()
    await expect(recibe.getByText('El auditorio está ocupado esa fecha. Propón hoy.')).toBeVisible()
    await expect(recibe.getByLabel('Evento o actividad')).toHaveValue(evento)
    await expect(recibe.getByLabel('Dependencia o programa')).toHaveValue('Contaduría Pública')
    // Ley 1581: la autorización nunca viene marcada, tampoco al corregir.
    await expect(recibe.locator('#autorizaDatos')).not.toBeChecked()
    await revisarVista('solicitud-corregir')

    // Empieza en ~10 min: la recepción ya queda habilitada (desde 30 min antes) al aprobar.
    await diligenciar(recibe, franjaDeHoy(10))
    await recibe.locator('#autorizaDatos').check()
    await recibe.getByRole('button', { name: 'Enviar corrección' }).click()
    await expect(recibe.getByRole('heading', { name: 'Solicitud en revisión' })).toBeVisible()
  })

  await test.step('Infraestructura aprueba la versión corregida', async () => {
    await entrega.reload()
    await entrega.getByRole('button', { name: 'Aprobar' }).click()
    await expect(entrega.getByText(/^• El botón se habilita el .+\.$/)).toBeVisible()
    await expect(entrega.getByRole('button', { name: 'Aprobar' })).toHaveCount(0)
  })

  await test.step('Dentro de su ventana, quien solicitó confirma la recepción', async () => {
    await recibe.reload()
    await expect(recibe.getByRole('heading', { name: 'Confirma la recepción' })).toBeVisible()
    await revisarVista('confirmar-recepcion')
    await recibe.getByRole('button', { name: 'Confirmar recepción' }).click()
    await expect(recibe.getByRole('heading', { name: 'Recepción del espacio' })).toBeVisible()
    await recibe.getByRole('button', { name: 'Comenzar' }).click()

    // Lo diligenciado en la solicitud llega precargado.
    await expect(recibe.getByLabel('Dependencia o programa')).toHaveValue('Contaduría Pública')
    await expect(recibe.getByLabel('Celular')).toHaveValue('3001234567')
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(recibe.getByRole('heading', { name: 'Elementos que recibes' })).toBeVisible()
  })

  await test.step('Checklist: las reglas se cumplen y el atajo respeta la novedad', async () => {
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

    await sillas.getByLabel('¿Qué novedad encontraste?').fill('Falta una silla; hay 149 en sala.')
    await sillas.locator('input[type=file]').setInputFiles(await foto(recibe))
    await expect(sillas.getByRole('img', { name: 'Foto: novedad.png' })).toBeVisible()
    await expect(sillas.getByLabel('Subiendo foto')).toHaveCount(0)

    // «Todo en buen estado» marca el resto, también las condiciones, sin pisar la novedad.
    await recibe.getByRole('button', { name: 'Todo en buen estado' }).click()
    await expect(
      recibe.getByRole('status').filter({ hasText: 'conservamos 1 con novedad' }),
    ).toBeVisible()
    await expect(sillas.getByLabel('¿Qué novedad encontraste?')).toHaveValue(
      'Falta una silla; hay 149 en sala.',
    )
    await expect(recibe.getByText('6 de 6 revisados')).toBeVisible()
    await revisarVista('checklist-atajo')
    await recibe.getByRole('button', { name: 'Continuar' }).click()
    await expect(recibe.getByRole('heading', { name: 'Condiciones del espacio' })).toBeVisible()
    await expect(recibe.getByText('11 de 11 revisados')).toBeVisible()
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
    await expect(recibe.getByText('16 conformes · 1 con novedad')).toBeVisible()
    await recibe.getByRole('button', { name: 'Confirmar recepción' }).click()
    await expect(recibe).toHaveURL(/\/r\/[\w-]+\/confirmada$/)
    await expect(recibe.getByRole('heading', { name: 'Recepción confirmada' })).toBeVisible()
    consecutivo = (await recibe.getByText(/^REC-\d{6}$/).textContent())!
    expect(consecutivo).toMatch(/^REC-\d{6}$/)
    await revisarVista('recepcion-confirmada')

    await recibe.getByRole('link', { name: 'Ver constancia' }).click()
    await expect(recibe).toHaveURL(new RegExp(`/verificar/${consecutivo}$`))
    await expect(recibe.getByRole('heading', { name: 'Constancia íntegra' })).toBeVisible()
    await expect(recibe.getByText(`${SOLICITANTE.nombre} (${SOLICITANTE.correo})`)).toBeVisible()
    await expect(recibe.getByText('149/150 · Novedad')).toBeVisible()
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
    await recibe.goto(`/mi-solicitud/${id}`)
    await expect(recibe).toHaveURL(/\/devolucion\/[0-9a-f-]{36}\?t=/)
    enlaceDevolucion = recibe.url()
    await intruso.goto(`/mi-solicitud/${id}`)
    await expect(intruso.getByRole('heading', { name: 'Este enlace es personal' })).toBeVisible()
  })

  await test.step('Solo quien recibió declara la devolución, con novedad y foto', async () => {
    await intruso.goto(enlaceDevolucion)
    await expect(intruso.getByRole('button', { name: 'Declarar devolución' })).toHaveCount(0)

    await revisarVista('devolucion')
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

test('aprobada fuera de su ventana: no deja confirmar y dice desde cuándo', async ({ browser }) => {
  const evento = `Consejo académico ${Date.now().toString(36)}`
  const entrega = await navegador(browser)
  const recibe = await navegador(browser)
  const { id, enlace } = await emitirEnlace(entrega, SOLICITANTE.correo, '')

  await test.step('Sin referencia, quien solicita nombra el evento', async () => {
    await recibe.goto(`/mi-solicitud/${id}`)
    // El enlace estable exige sesión y vuelve a él después de ingresar.
    await expect(recibe).toHaveURL(/\/\?destino=/)
    await ingresar(recibe, SOLICITANTE)
    await expect(recibe).toHaveURL(enlace)
    await expect(recibe.getByLabel('Evento o actividad')).toHaveValue('')
    await diligenciar(recibe, franjaLejana(), evento)
    await recibe.getByText('Administrativo', { exact: true }).click()
    await recibe.getByLabel('Dependencia o programa').fill('Rectoría')
    await recibe.getByLabel('Celular').fill('3109876543')
    await recibe.getByLabel('Asistentes estimados').fill('20')
    await recibe.locator('#autorizaDatos').check()
    await recibe.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(recibe.getByRole('heading', { name: 'Solicitud en revisión' })).toBeVisible()
  })

  await test.step('Aprobada, espera su hora: sin botón de confirmar', async () => {
    await entrega.reload()
    await entrega.getByRole('button', { name: 'Aprobar' }).click()
    await expect(entrega.getByText(/^• El botón se habilita el .+\.$/)).toBeVisible()

    await recibe.reload()
    await expect(recibe.getByRole('heading', { name: 'Solicitud aprobada' })).toBeVisible()
    await expect(
      recibe.getByText(/Podrás confirmar la recepción del espacio desde las/),
    ).toBeVisible()
    await expect(recibe.getByRole('button', { name: 'Confirmar recepción' })).toHaveCount(0)
  })

  await test.step('Un id inexistente se ve igual que uno ajeno', async () => {
    await recibe.goto(`/mi-solicitud/${randomUUID()}`)
    await expect(recibe.getByRole('heading', { name: 'Este enlace es personal' })).toBeVisible()
  })
})
