'use client'

import { CalendarPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import type { Espacio } from '@check-auditorio/shared'
import { LIMITES, nuevaAsignacionInputSchema } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'

type Errores = Partial<Record<'espacioId' | 'evento' | 'fecha' | 'inicio' | 'fin', string>>

/** Convierte fecha (AAAA-MM-DD) y hora (HH:MM) locales de Bogotá a ISO con offset. */
const aIsoBogota = (fecha: string, hora: string) => `${fecha}T${hora}:00-05:00`

export function FormNuevaAsignacion({ espacios }: { espacios: Espacio[] }) {
  const router = useRouter()
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
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
    // Fase 1: sin guardado real. Se muestra la asignación de ejemplo con su QR.
    router.push('/panel/asignaciones/asg-003')
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="espacioId" label="Espacio" error={errores.espacioId}>
        <Select
          id="espacioId"
          name="espacioId"
          defaultValue={espacios[0]?.id}
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

      <div className="flex justify-end border-t border-pearl-200 pt-5">
        <Button type="submit" variante="primario" tamano="lg" disabled={enviando}>
          <CalendarPlus aria-hidden />
          {enviando ? 'Programando…' : 'Programar y generar QR'}
        </Button>
      </div>
    </form>
  )
}
