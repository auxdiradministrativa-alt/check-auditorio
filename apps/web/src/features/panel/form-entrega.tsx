'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { entregaInputSchema, LIMITES, type Espacio } from '@check-auditorio/shared'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { uuid } from '@/lib/uuid'
import { crearEntrega } from './acciones'

export function FormEntrega({
  espacios,
  onEmitido,
}: {
  espacios: Espacio[]
  onEmitido?: () => void
}) {
  const router = useRouter()
  const [clave] = useState(uuid)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    if (enviando) return
    const form = ev.currentTarget
    const datos = new FormData(form)
    const valor = (campo: string) => String(datos.get(campo) ?? '')
    const resultado = entregaInputSchema.safeParse({
      espacioId: valor('espacioId'),
      evento: valor('evento'),
      correoReceptor: valor('correoReceptor'),
      inicio: `${valor('fecha')}T${valor('inicio')}:00-05:00`,
      fin: `${valor('fecha')}T${valor('fin')}:00-05:00`,
    })
    if (!resultado.success) {
      const e: Record<string, string> = {}
      for (const issue of resultado.error.issues) e[String(issue.path[0])] ??= issue.message
      setErrores(e)
      form.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`)?.focus()
      return
    }
    setErrores({})
    setEnviando(true)
    try {
      const r = await crearEntrega(resultado.data, clave)
      if (!r.ok) {
        setErrores({ servidor: r.mensaje })
        return
      }
      router.push(`/panel?evento=${r.datos.id}#operacion`)
      onEmitido?.()
    } catch {
      setErrores({ servidor: 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.' })
    } finally {
      setEnviando(false)
    }
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" aria-busy={enviando}>
      {!espacios.length && (
        <p role="alert" className="text-sm text-destructive">
          No hay espacios activos. Solicita a Infraestructura que habilite un espacio en el
          catálogo.
        </p>
      )}
      <fieldset disabled={enviando} className="grid gap-5 sm:grid-cols-2">
        <Field id="espacioId" label="Espacio" error={errores.espacioId}>
          <Select id="espacioId" name="espacioId" required defaultValue={espacios[0]?.id}>
            {espacios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} · {e.ubicacion}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="evento" label="Evento o actividad" error={errores.evento}>
          <Input
            id="evento"
            name="evento"
            required
            minLength={3}
            maxLength={LIMITES.eventoMax}
            placeholder="Ej. Grados"
            aria-invalid={!!errores.evento}
            aria-describedby={errores.evento ? 'evento-error' : undefined}
          />
        </Field>
        <Field
          id="correoReceptor"
          label="Correo de quien recibe"
          error={errores.correoReceptor}
          hint="El enlace y el QR solo abrirán con esta cuenta institucional."
        >
          <Input
            id="correoReceptor"
            name="correoReceptor"
            type="email"
            required
            placeholder="nombre@americana.edu.co"
            aria-invalid={!!errores.correoReceptor}
            aria-describedby={
              errores.correoReceptor ? 'correoReceptor-error' : 'correoReceptor-hint'
            }
          />
        </Field>
        <Field id="fecha" label="Fecha de la entrega" hint="Horario de Colombia.">
          <Input id="fecha" name="fecha" type="date" required />
        </Field>
        {(['inicio', 'fin'] as const).map((campo) => (
          <Field
            key={campo}
            id={campo}
            label={campo === 'inicio' ? 'Hora de inicio' : 'Hora de fin'}
            error={errores[campo]}
          >
            <Input
              id={campo}
              name={campo}
              type="time"
              required
              aria-invalid={!!errores[campo]}
              aria-describedby={errores[campo] ? `${campo}-error` : undefined}
            />
          </Field>
        ))}
      </fieldset>
      <p className="text-sm text-muted-foreground">
        Al crear la entrega obtendrás un enlace y un QR para que la persona revise el espacio y
        firme su acta de conformidad.
      </p>
      {errores.servidor && (
        <p role="alert" className="text-sm text-destructive">
          {errores.servidor}
        </p>
      )}
      <div className="flex justify-end border-t border-border pt-5">
        <Button
          type="submit"
          variante="primario"
          tamano="lg"
          disabled={enviando || !espacios.length}
        >
          {enviando ? 'Creando entrega…' : 'Crear entrega'}
        </Button>
      </div>
    </form>
  )
}
