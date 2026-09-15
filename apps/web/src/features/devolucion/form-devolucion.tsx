'use client'

import { CircleCheckBig, Send } from 'lucide-react'
import { useState } from 'react'

import type { ElementoCatalogo, ResultadoDevolucion } from '@check-auditorio/shared'
import { devolucionInputSchema, LIMITES } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { SelectorFotos } from '@/features/recepcion/selector-fotos'
import type { FotoLocal } from '@/features/recepcion/tipos'
import { cn } from '@/lib/cn'
import { uuid } from '@/lib/uuid'

type Novedad = { observacion: string; fotos: FotoLocal[] }

const OPCIONES = [
  { valor: 'BUENAS_CONDICIONES', etiqueta: 'Buenas condiciones', tono: 'ok' },
  { valor: 'CON_NOVEDADES', etiqueta: 'Con novedades', tono: 'peligro' },
] as const

export function FormDevolucion({
  catalogo,
  evento,
}: {
  catalogo: ElementoCatalogo[]
  evento: string
}) {
  const [claveIdempotencia] = useState(uuid)
  const [resultado, setResultado] = useState<ResultadoDevolucion | null>(null)
  const [novedades, setNovedades] = useState<Record<string, Novedad>>({})
  const [declaracion, setDeclaracion] = useState(false)
  const [errores, setErrores] = useState<string[]>([])
  const [enviada, setEnviada] = useState(false)
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
    const r = devolucionInputSchema.safeParse({
      claveIdempotencia,
      resultado,
      novedades:
        resultado === 'CON_NOVEDADES'
          ? Object.entries(novedades).map(([elementoId, n]) => ({
              elementoId,
              observacion: n.observacion,
              fotoIds: n.fotos.map((f) => f.id),
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
    await new Promise((res) => setTimeout(res, 900))
    setEnviada(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (enviada) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-ok-50 ring-1 ring-ok-700/20">
          <CircleCheckBig className="size-10 text-ok-700" aria-hidden />
        </span>
        <h1 className="font-display text-3xl font-semibold">Devolución registrada</h1>
        <p className="max-w-sm text-ink-600">
          Gracias. Infraestructura recibió tu declaración sobre «{evento}».
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">¿Cómo devuelves el espacio?</CardTitle>
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
                        fotos={n.fotos}
                        onCambio={(fotos) =>
                          setNovedades((prev) => ({ ...prev, [el.id]: { ...n, fotos } }))
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
