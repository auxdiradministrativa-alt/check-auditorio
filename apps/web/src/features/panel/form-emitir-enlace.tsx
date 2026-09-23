'use client'

import { Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { DOMINIO_INSTITUCIONAL, LIMITES, invitacionInputSchema } from '@check-auditorio/shared'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

import { emitirEnlace } from './acciones'

type Errores = Partial<Record<'correoSolicitante' | 'referencia' | 'servidor', string>>

/**
 * Acción principal del centro de gestión en el flujo por enlace: Infraestructura formaliza una
 * solicitud que llegó por cualquier canal emitiendo un enlace que solo abre esa cuenta.
 */
export function FormEmitirEnlace({ onEmitido }: { onEmitido?: () => void }) {
  const router = useRouter()
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const datos = new FormData(ev.currentTarget)
    const resultado = invitacionInputSchema.safeParse({
      correoSolicitante: String(datos.get('correoSolicitante') ?? ''),
      referencia: String(datos.get('referencia') ?? ''),
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
    const r = await emitirEnlace(resultado.data)
    if (!r.ok) {
      setErrores({ servidor: r.mensaje })
      setEnviando(false)
      return
    }
    router.push(`/panel?evento=${r.datos.id}#operacion`)
    onEmitido?.()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="correoSolicitante"
          label="Correo de quien solicita"
          hint={`Solo esta cuenta @${DOMINIO_INSTITUCIONAL} podrá abrir el enlace.`}
          error={errores.correoSolicitante}
        >
          <Input
            id="correoSolicitante"
            name="correoSolicitante"
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            required
            placeholder={`nombre@${DOMINIO_INSTITUCIONAL}`}
            aria-invalid={!!errores.correoSolicitante}
            aria-describedby={
              errores.correoSolicitante ? 'correoSolicitante-error' : 'correoSolicitante-hint'
            }
          />
        </Field>
        <Field
          id="referencia"
          label="Referencia"
          opcional
          hint="Te ayuda a reconocerla en el panel. Quien solicita escribe el nombre final."
          error={errores.referencia}
        >
          <Input
            id="referencia"
            name="referencia"
            maxLength={LIMITES.eventoMax}
            placeholder="Ej. Foro de contaduría"
            aria-invalid={!!errores.referencia}
            aria-describedby={errores.referencia ? 'referencia-error' : 'referencia-hint'}
          />
        </Field>
      </div>

      {errores.servidor && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errores.servidor}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" variante="primario" tamano="lg" disabled={enviando}>
          <Link2 aria-hidden />
          {enviando ? 'Emitiendo…' : 'Emitir enlace'}
        </Button>
      </div>
    </form>
  )
}
