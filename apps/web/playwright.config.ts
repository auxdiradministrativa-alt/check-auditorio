import { defineConfig, devices } from '@playwright/test'

/*
 * Prueba de uso punta a punta con login simulado.
 * - `pnpm e2e`: registro en memoria; cada corrida levanta su propio `next dev` con el libro vacío.
 * - `pnpm e2e:gas` (playwright.gas.config.ts): registro contra el Apps Script y el Sheet REALES de
 *   `.env.local`. Escribe filas de prueba y consume consecutivos. El login sigue siendo local.
 */

const PUERTO = 3100
const URL_BASE = `http://localhost:${PUERTO}`

export function configurar({ contraGas }: { contraGas: boolean }) {
  // Lo leen las pruebas (`e2e/apoyo.ts`): contra el Sheet real los correos salen de verdad.
  if (contraGas) process.env.CHECK_E2E_GAS = '1'
  return defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: contraGas ? 600_000 : 240_000,
    expect: { timeout: contraGas ? 60_000 : 30_000 },
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
        CHECK_E2E: '1',
        NEXT_PUBLIC_APP_URL: URL_BASE,
        // Vacías = ausentes (Next no pisa con .env.local una variable ya definida): login local.
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        // En memoria también se vacía el registro; contra GAS next dev las toma de .env.local.
        ...(contraGas ? {} : { GAS_WEBAPP_URL: '', GAS_HMAC_SECRET: '', BETTER_AUTH_SECRET: '' }),
      },
    },
  })
}

export default configurar({ contraGas: false })
