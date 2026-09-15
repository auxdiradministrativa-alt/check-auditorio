'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

/**
 * Vuelve a pedir los datos del servidor `ms` después de que termine el refresco anterior, mientras
 * está montado y la pestaña visible. Con Apps Script un refresco tarda varios segundos: un
 * `setInterval` lanzaba el siguiente antes de acabar, cancelaba el anterior y la página nunca cambiaba.
 */
export function RefrescoAutomatico({ ms = 4000 }: { ms?: number }) {
  const router = useRouter()
  const [refrescando, iniciar] = useTransition()
  const [vuelta, setVuelta] = useState(0)

  useEffect(() => {
    if (refrescando) return
    const id = window.setTimeout(() => {
      if (document.visibilityState === 'visible') iniciar(() => router.refresh())
      setVuelta((v) => v + 1)
    }, ms)
    return () => window.clearTimeout(id)
  }, [refrescando, vuelta, router, ms])

  return null
}
