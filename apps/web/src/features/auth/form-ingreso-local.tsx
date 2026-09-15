'use client'

import { LogIn } from 'lucide-react'
import { useActionState } from 'react'

import { DOMINIO_INSTITUCIONAL } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

import { ingresarLocal } from './acciones'

/** Solo en desarrollo sin credenciales de Google: simula la cuenta con la que se firma. */
export function FormIngresoLocal({ destino }: { destino: string }) {
  const [estado, accion, pendiente] = useActionState(ingresarLocal, null)
  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="destino" value={destino} />
      <Field id="nombre" label="Nombre">
        <Input id="nombre" name="nombre" autoComplete="name" placeholder="Laura Pérez Gómez" />
      </Field>
      <Field id="correo" label="Correo institucional">
        <Input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          placeholder={`nombre@${DOMINIO_INSTITUCIONAL}`}
        />
      </Field>
      {estado && !estado.ok && (
        <p role="alert" className="text-sm font-medium text-danger-700">
          {estado.mensaje}
        </p>
      )}
      <Button type="submit" variante="primario" tamano="lg" bloque disabled={pendiente}>
        <LogIn aria-hidden />
        {pendiente ? 'Ingresando…' : 'Ingresar (modo local)'}
      </Button>
    </form>
  )
}
