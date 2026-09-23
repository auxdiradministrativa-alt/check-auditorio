/** Primer foco de cada página: permite a quien navega con teclado saltar la cabecera. */
export function SaltarContenido() {
  return (
    <a
      href="#contenido"
      className="sr-only rounded-lg bg-primary-strong px-4 py-3 text-sm font-semibold text-primary-strong-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Saltar al contenido
    </a>
  )
}
