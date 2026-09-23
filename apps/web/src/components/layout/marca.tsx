import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/cn'

/*
 * Escudo institucional · filete vertical · área responsable.
 *
 * Dos variantes porque el logotipo completo lleva dentro «VIGILADA MINEDUCACIÓN»:
 * a la altura de una barra de 64 px esa línea mide unos 3 px y se vuelve un
 * borrón. Por eso la barra usa el escudo solo y el hero el logotipo completo,
 * que es donde hay sitio para leerlo.
 *
 * Ninguna de las dos repite «Corporación Universitaria Americana» en texto:
 * el nombre ya está dentro de la imagen y escribirlo al lado lo duplicaba.
 */

const LOGOS = {
  completa: {
    src: '/logo-americana-completo.png',
    ancho: 748,
    alto: 333,
    clase: 'h-16 sm:h-24 lg:h-28',
  },
  compacta: { src: '/logo-americana.png', ancho: 434, alto: 575, clase: 'h-10' },
} as const

export function Marca({
  href = '/',
  variante = 'compacta',
  className,
}: {
  href?: string
  variante?: keyof typeof LOGOS
  className?: string
}) {
  const logo = LOGOS[variante]
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 sm:gap-5',
        // En un teléfono el conjunto no cabe en una fila sin encogerlo hasta lo
        // ilegible: se apila y el filete pasa a horizontal.
        variante === 'completa' && 'flex-col items-start gap-3 sm:flex-row sm:items-center',
        className,
      )}
      aria-label="Corporación Universitaria Americana · Infraestructura"
    >
      <Image
        src={logo.src}
        alt=""
        width={logo.ancho}
        height={logo.alto}
        priority
        className={cn('w-auto', logo.clase)}
      />
      <span
        aria-hidden
        className={cn(
          'rounded-full',
          variante === 'completa'
            ? 'h-0.5 w-16 sm:my-1 sm:h-auto sm:w-0.5 sm:self-stretch'
            : 'my-1.5 w-0.5 self-stretch',
          'bg-primary',
        )}
      />
      <span
        aria-hidden
        className={cn(
          'font-semibold',
          variante === 'completa' ? 'text-base sm:text-xl' : 'text-xs sm:text-sm',
          'text-primary-strong',
        )}
      >
        Infraestructura
      </span>
    </Link>
  )
}
