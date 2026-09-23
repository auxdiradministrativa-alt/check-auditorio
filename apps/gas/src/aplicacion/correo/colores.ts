/*
 * Paleta Sage Garden de `apps/web/src/app/globals.css`, en hex: los clientes de correo no leen
 * variables CSS. Mismo nombre que el token web. `pruebas/correo.test.ts` compara ambos ficheros
 * para que no se desalineen: si cambia un token allá, esta prueba se pone roja.
 */
export const COLORES = {
  background: '#f8f7f4',
  card: '#ffffff',
  foreground: '#1a1f2e',
  'muted-foreground': '#6b7280',
  muted: '#e8e6e1',
  border: '#e8e6e1',
  'primary-strong': '#56685b',
  'primary-soft': '#eef1ea',
  'attention-accent': '#c9a227',
  attention: '#7d6315',
  'attention-soft': '#f6efdc',
  success: '#3d6b4a',
  'success-soft': '#e4ede5',
  'destructive-strong': '#a8322f',
  'destructive-soft': '#f8e5e4',
} as const

export type Color = keyof typeof COLORES
