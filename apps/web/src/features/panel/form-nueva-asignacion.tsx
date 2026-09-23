'use client'

import { CalendarPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import type { Espacio, ElementoCatalogo } from '@check-auditorio/shared'
import { LIMITES, nuevaAsignacionInputSchema } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'

import { ResumenCatalogo } from './resumen-catalogo'

import { programarAsignacion } from './acciones'

type Errores = Partial<
  Record<'espacioId' | 'evento' | 'fecha' | 'inicio' | 'fin' | 'servidor', string>
>

/** Convierte fecha (AAAA-MM-DD) y hora (HH:MM) locales de Bogotá a ISO con offset. */
const aIsoBogota = (fecha: string, hora: string) => `${fecha}T${hora}:00-05:00`

export function FormNuevaAsignacion({
  espacios,
  elementos = [],
  onCreada,
}: {
  espacios: Espacio[]
  elementos?: ElementoCatalogo[]
  onCreada?: () => void
}) {
  const [espacioId, setEspacioId] = useState(espacios[0]?.id ?? '')
  const router = useRouter()
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const datos = new FormData(ev.currentTarget)
    const fecha = String(datos.get('fecha') ?? '')
    const horaInicio = String(datos.get('inicio') ?? '')
    const horaFin = String(datos.get('fin') ?? '')

    if (!fecha || !horaInicio || !horaFin) {
      setErrores({
        fecha: fecha ? undefined : 'Selecciona la fecha.',
        inicio: horaInicio ? undefined : 'Indica la hora de inicio.',
        fin: horaFin ? undefined : 'Indica la hora de fin.',
      })
      return
    }

    const resultado = nuevaAsignacionInputSchema.safeParse({
      espacioId: datos.get('espacioId'),
      evento: datos.get('evento'),
      inicio: aIsoBogota(fecha, horaInicio),
      fin: aIsoBogota(fecha, horaFin),
    })

    if (!resultado.success) {
      const e: Errores = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof Errores
        e[campo] ??= issue.message
      }
      setErrores(e)
      return
    }

    setErrores({})
    setEnviando(true)
    const r = await programarAsignacion(resultado.data)
    if (!r.ok) {
      setErrores({ servidor: r.mensaje })
      setEnviando(false)
      return
    }
    router.push(`/panel?evento=${r.datos.id}#operacion`)
    onCreada?.()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="espacioId" label="Espacio" error={errores.espacioId}>
        <Select
          id="espacioId"
          name="espacioId"
          value={espacioId}
          onChange={(ev) => setEspacioId(ev.target.value)}
          aria-invalid={!!errores.espacioId}
        >
          {espacios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre} · {e.ubicacion} · {e.capacidad} personas
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="evento"
        label="Evento o actividad"
        hint="Así aparecerá en la constancia y en los correos."
        error={errores.evento}
      >
        <Input
          id="evento"
          name="evento"
          maxLength={LIMITES.eventoMax}
          placeholder="Ej. Foro de Investigación Contable"
          aria-invalid={!!errores.evento}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="fecha" label="Fecha" error={errores.fecha}>
          <Input id="fecha" name="fecha" type="date" aria-invalid={!!errores.fecha} />
        </Field>
        <Field id="inicio" label="Hora de inicio" error={errores.inicio}>
          <Input id="inicio" name="inicio" type="time" step={300} aria-invalid={!!errores.inicio} />
        </Field>
        <Field id="fin" label="Hora de fin" error={errores.fin}>
          <Input id="fin" name="fin" type="time" step={300} aria-invalid={!!errores.fin} />
        </Field>
      </div>

      {errores.servidor && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errores.servidor}
        </p>
      )}

      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Ver elementos del espacio seleccionado
        </summary>
        <div className="pt-4">
          <ResumenCatalogo catalogo={elementos.filter((e) => e.espacioId === espacioId)} />
        </div>
      </details>
      <div className="flex justify-end border-t border-border pt-5">
        <Button
          type="submit"
          variante="primario"
          tamano="lg"
          disabled={enviando || !espacios.length}
        >
          <CalendarPlus aria-hidden />
          {enviando ? 'Programando…' : 'Crear evento y generar QR'}
        </Button>
      </div>
    </form>
  )
}
