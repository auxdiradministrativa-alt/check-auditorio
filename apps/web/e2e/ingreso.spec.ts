import { expect, test } from '@playwright/test'

import { INTRUSO, ingresar } from './apoyo'

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
