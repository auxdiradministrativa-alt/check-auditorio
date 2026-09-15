import { defineConfig, devices } from '@playwright/test'

/*
 * Prueba de uso punta a punta en modo local: registro en memoria y login simulado.
 * Cada corrida levanta su propio `next dev` para arrancar con el libro en memoria vacío.
 */

const PUERTO = 3100
const URL_BASE = `http://localhost:${PUERTO}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_BASE,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 90_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec next dev -p ${PUERTO}`,
    url: URL_BASE,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_URL: URL_BASE,
      // Vacías = ausentes: fuerza registro en memoria y login local.
      GAS_WEBAPP_URL: '',
      GAS_HMAC_SECRET: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      BETTER_AUTH_SECRET: '',
    },
  },
})
