import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Los tamaños propios deben distinguirse de text-* usado para colores.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // `card-title` y no `card`: text-card sería el color de la superficie (token card).
      'font-size': [{ text: ['page', 'page-lg', 'section', 'card-title'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
