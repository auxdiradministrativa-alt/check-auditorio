import { entorno } from '@/servidor/entorno'

/** Franja visible solo en desarrollo sin Google: los datos viven en memoria y se pierden al reiniciar. */
export function AvisoDemo() {
  if (!entorno().esLocal) return null
  return (
    <div className="bg-gold-500 px-4 py-1.5 text-center text-xs font-semibold text-navy-950 print:hidden">
      Modo local · registro en memoria y cuentas simuladas (se borra al reiniciar el servidor)
    </div>
  )
}
