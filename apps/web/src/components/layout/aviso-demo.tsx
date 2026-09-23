import { entorno } from '@/servidor/entorno'

/** Franja visible mientras alguna pieza corre en modo local; dice cuál, porque se pueden combinar. */
export function AvisoDemo() {
  const { esLocal, registro, auth } = entorno()
  if (!esLocal) return null
  const partes = [
    registro === 'memoria'
      ? 'registro en memoria (se borra al reiniciar el servidor)'
      : 'registro en el Sheet real',
    auth === 'local' ? 'cuentas simuladas' : 'ingreso con Google',
  ]
  return (
    <div className="border-b border-attention-accent/40 bg-attention-soft px-4 py-1.5 text-center text-xs font-semibold text-attention print:hidden">
      Modo local · {partes.join(' · ')}
    </div>
  )
}
