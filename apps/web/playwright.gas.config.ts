import { configurar } from './playwright.config'

// `pnpm e2e:gas`: la misma prueba de uso contra el Apps Script y el Sheet reales de `.env.local`.
export default configurar({ contraGas: true })
