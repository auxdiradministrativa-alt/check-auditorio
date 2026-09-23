'use client'

import { Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { ElementoCatalogo, ResultadoDevolucion } from '@check-auditorio/shared'
import { devolucionInputSchema, LIMITES } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { SelectorFotos } from '@/features/fotos/selector-fotos'
import { haySubidasPendientes, idsSubidos, type FotoLocal } from '@/features/fotos/tipos'
import { cn } from '@/lib/cn'
import { uuid } from '@/lib/uuid'

import { declararDevolucion } from './acciones'

type Novedad = { observacion: string; fotos: FotoLocal[] }

const OPCIONES = [
  { valor: 'BUENAS_CONDICIONES', etiqueta: 'Buenas condiciones', tono: 'ok' },
  { valor: 'CON_NOVEDADES', etiqueta: 'Con novedades', tono: 'peligro' },
] as const

export function FormDevolucion({
  asignacionId,
  token,
  catalogo,
}: {
  asignacionId: string
  token: string
  catalogo: ElementoCatalogo[]
}) {
  const router = useRouter()
  const [claveIdempotencia] = useState(uuid)
  const [resultado, setResultado] = useState<ResultadoDevolucion | null>(null)
  const [novedades, setNovedades] = useState<Record<string, Novedad>>({})
  const [declaracion, setDeclaracion] = useState(false)
  const [errores, setErrores] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)

  function alternar(id: string) {
    setNovedades((prev) => {
      const next = { ...prev }
      if (next[id]) {
        for (const f of next[id].fotos) URL.revokeObjectURL(f.url)
        delete next[id]
      } else {
        next[id] = { observacion: '', fotos: [] }
      }
      return next
    })
  }

  async function enviar() {
    if (Object.values(novedades).some((n) => haySubidasPendientes(n.fotos))) {
      setErrores(['Espera a que terminen de subir las fotos.'])
      return
    }
    const r = devolucionInputSchema.safeParse({
      claveIdempotencia,
      resultado,
      novedades:
        resultado === 'CON_NOVEDADES'
          ? Object.entries(novedades).map(([elementoId, n]) => ({
              elementoId,
              observacion: n.observacion,
              fotoIds: idsSubidos(n.fotos),
            }))
          : [],
      declaracion,
    })
    if (!r.success) {
      setErrores([...new Set(r.error.issues.map((i) => i.message))])
      return
    }
    setErrores([])
    setEnviando(true)
    const respuesta = await declararDevolucion(asignacionId, token, r.data)
    if (!respuesta.ok) {
      setEnviando(false)
      setErrores([respuesta.mensaje])
      return
    }
    // La página, ya con la devolución registrada, muestra la confirmación.
    window.scrollTo({ top: 0, behavior: 'smooth' })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo devuelves el espacio?</CardTitle>
          <CardDescription>Declara el estado en que queda el espacio al terminar.</CardDescription>
        </CardHeader>
        <CardBody>
          <Segmented
            nombre="resultado"
            etiqueta="Estado de la devolución"
            opciones={OPCIONES}
            valor={resultado}
            onCambio={setResultado}
          />
        </CardBody>
      </Card>

      {resultado === 'CON_NOVEDADES' && (
        <Card className="border-danger-700/25">
          <CardHeader>
            <CardTitle>¿Qué presenta novedad?</CardTitle>
            <CardDescription>
              Selecciona los elementos y describe qué pasó, con foto.
            </CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {catalogo.map((el) => {
              const n = novedades[el.id]
              return (
                <div
                  key={el.id}
                  className={cn(
                    'rounded-xl border bg-white',
                    n ? 'border-danger-700/30' : 'border-pearl-200',
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-3 p-3.5">
                    <input
                      type="checkbox"
                      checked={!!n}
                      onChange={() => alternar(el.id)}
                      className="size-5 accent-navy-800"
                    />
                    <span className="font-medium">{el.nombre}</span>
                  </label>
                  {n && (
                    <div className="flex flex-col gap-3 border-t border-pearl-200 p-3.5">
                      <Textarea
                        aria-label={`Novedad de ${el.nombre}`}
                        rows={2}
                        maxLength={LIMITES.observacionMax}
                        placeholder="Describe la novedad."
                        value={n.observacion}
                        onChange={(e) =>
                          setNovedades((prev) => ({
                            ...prev,
                            [el.id]: { ...n, observacion: e.target.value },
                          }))
                        }
                      />
                      <SelectorFotos
                        asignacionId={asignacionId}
                        fotos={n.fotos}
                        onCambio={(actualizar) =>
                          setNovedades((prev) => {
                            const actual = prev[el.id]
                            if (!actual) return prev
                            return {
                              ...prev,
                              [el.id]: { ...actual, fotos: actualizar(actual.fotos) },
                            }
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}

      <Checkbox
        id="declaracion"
        checked={declaracion}
        onChange={(e) => setDeclaracion(e.target.checked)}
      >
        Declaro que la información es verdadera. Entiendo que las diferencias que se detecten en la
        siguiente entrega del espacio podrán asociarse a este préstamo.
      </Checkbox>

      {errores.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm font-medium text-danger-700">
          {errores.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}

      <Button variante="oro" tamano="lg" bloque onClick={enviar} disabled={enviando}>
        <Send aria-hidden />
        {enviando ? 'Enviando…' : 'Declarar devolución'}
      </Button>
    </div>
  )
}
