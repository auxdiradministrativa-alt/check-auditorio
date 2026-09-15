'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Vuelve a pedir los datos del servidor cada `ms` mientras está montado y la pestaña visible. */
export function RefrescoAutomatico({ ms = 4000 }: { ms?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, ms)
    return () => window.clearInterval(id)
  }, [router, ms])
  return null
}
