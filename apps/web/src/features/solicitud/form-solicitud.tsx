'use client'

import {
  CalendarDays,
  MapPin,
  MessageSquareWarning,
  Send,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import type { Asignacion, Espacio, RolReceptor, Terminos } from '@check-auditorio/shared'
import {
  ETIQUETAS_ROL,
  LIMITES,
  ROLES_RECEPTOR,
  solicitudInputSchema,
} from '@check-auditorio/shared'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, Input } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'

import { enviarSolicitud } from './acciones'

type Campo =
  | 'evento'
  | 'fecha'
  | 'inicio'
  | 'fin'
  | 'rol'
  | 'dependencia'
  | 'cargo'
  | 'celular'
  | 'asistentesEstimados'
  | 'autorizaDatos'
type Errores = Partial<Record<Campo | 'servidor', string>>

/** Bogotá no tiene horario de verano: el desfase es fijo (igual que `isoBogota` del contrato). */
const DESFASE_MS = 5 * 60 * 60 * 1000

/** Fecha (AAAA-MM-DD) y hora (HH:MM) locales de Bogotá de un instante. */
const partesBogota = (iso: string | Date) => {
  const local = new Date(new Date(iso).getTime() - DESFASE_MS).toISOString()
  return { fecha: local.slice(0, 10), hora: local.slice(11, 16) }
}

/** Convierte fecha y hora locales de Bogotá a ISO con desfase. */
const aIsoBogota = (fecha: string, hora: string) => `${fecha}T${hora}:00-05:00`

/** El evento lo nombra quien solicita; si Infraestructura dejó una referencia, se ofrece. */
const SIN_DEFINIR = 'Por definir'

export function FormSolicitud({
  token,
  asignacion,
  espacio,
  terminos,
}: {
  token: string
  asignacion: Asignacion
  espacio: Espacio
  terminos: Terminos
}) {
  const router = useRouter()
  // Solo una solicitud ya diligenciada (rechazada) trae franja propia: la invitación nace con
  // inicio = fin = hora de emisión, que no es una propuesta de quien solicita.
  const previa = asignacion.solicitud
  const franjaPrevia = previa
    ? { inicio: partesBogota(asignacion.inicio), fin: partesBogota(asignacion.fin) }
    : null

  const [evento, setEvento] = useState(asignacion.evento === SIN_DEFINIR ? '' : asignacion.evento)
  const [fecha, setFecha] = useState(franjaPrevia?.inicio.fecha ?? '')
  const [horaInicio, setHoraInicio] = useState(franjaPrevia?.inicio.hora ?? '')
  const [horaFin, setHoraFin] = useState(franjaPrevia?.fin.hora ?? '')
  const [rol, setRol] = useState<RolReceptor | null>(previa?.rol ?? null)
  const [dependencia, setDependencia] = useState(previa?.dependencia ?? '')
  const [cargo, setCargo] = useState(previa?.cargo ?? '')
  const [celular, setCelular] = useState(previa?.celular ?? '')
  const [asistentes, setAsistentes] = useState(previa ? String(previa.asistentesEstimados) : '')
  // Ley 1581: la autorización nunca viene marcada, tampoco al corregir.
  const [autorizaDatos, setAutorizaDatos] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  const hoy = partesBogota(new Date()).fecha

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const faltantes: Errores = {}
    if (!fecha) faltantes.fecha = 'Selecciona la fecha.'
    if (!horaInicio) faltantes.inicio = 'Indica la hora de inicio.'
    if (!horaFin) faltantes.fin = 'Indica la hora de fin.'

    const resultado = solicitudInputSchema.safeParse({
      evento,
      inicio: fecha && horaInicio ? aIsoBogota(fecha, horaInicio) : '',
      fin: fecha && horaFin ? aIsoBogota(fecha, horaFin) : '',
      rol,
      dependencia,
      cargo,
      celular,
      asistentesEstimados: asistentes === '' ? NaN : Number(asistentes),
      autorizaDatos,
    })

    const e: Errores = { ...faltantes }
    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as Campo
        e[campo] ??=
          campo === 'asistentesEstimados' ? 'Indica cuántas personas asistirán.' : issue.message
      }
    }
    if (Object.keys(e).length || !resultado.success) {
      setErrores(e)
      const primero = Object.keys(e)[0]
      if (primero) document.getElementById(primero)?.focus()
      return
    }

    setErrores({})
    setEnviando(true)
    const r = await enviarSolicitud(token, resultado.data)
    if (!r.ok) {
      setErrores({ servidor: r.mensaje })
      setEnviando(false)
      return
    }
    // La acción ya revalidó el enlace; el servidor pinta «En revisión» desde el registro.
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-page sm:text-page-lg">
          {asignacion.estado === 'RECHAZADA' ? 'Corrige tu solicitud' : 'Solicita el espacio'}
        </h1>
        <p className="text-muted-foreground">
          Cuéntanos qué evento harás y cuándo. Infraestructura revisará la solicitud y te avisará
          por correo si la aprueba.
        </p>
      </div>

      {asignacion.estado === 'RECHAZADA' && asignacion.motivoRechazo && (
        <Alert
          tono="peligro"
          icono={<MessageSquareWarning aria-hidden />}
          titulo="Infraestructura pidió corregir"
        >
          <p className="whitespace-pre-line">{asignacion.motivoRechazo}</p>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>El evento</CardTitle>
          <CardDescription>El espacio es fijo: el auditorio se presta completo.</CardDescription>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <dl className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-xl bg-muted px-4 py-3 text-sm">
            <div className="flex items-center gap-1.5">
              <dt>
                <MapPin className="size-4 text-primary" aria-label="Espacio" />
              </dt>
              <dd className="font-medium">
                {espacio.nombre} · {espacio.ubicacion}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt>
                <Users className="size-4 text-primary" aria-label="Capacidad" />
              </dt>
              <dd className="tabular">Capacidad: {espacio.capacidad} personas</dd>
            </div>
          </dl>

          <Field
            id="evento"
            label="Evento o actividad"
            hint="Así aparecerá en la constancia y en los correos."
            error={errores.evento}
          >
            <Input
              id="evento"
              maxLength={LIMITES.eventoMax}
              placeholder="Ej. Foro de Investigación Contable"
              value={evento}
              onChange={(e) => setEvento(e.target.value)}
              aria-invalid={!!errores.evento}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="fecha" label="Fecha" error={errores.fecha}>
              <Input
                id="fecha"
                type="date"
                min={hoy}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                aria-invalid={!!errores.fecha}
              />
            </Field>
            <Field id="inicio" label="Hora de inicio" error={errores.inicio}>
              <Input
                id="inicio"
                type="time"
                step={300}
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                aria-invalid={!!errores.inicio}
              />
            </Field>
            <Field id="fin" label="Hora de fin" error={errores.fin}>
              <Input
                id="fin"
                type="time"
                step={300}
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                aria-invalid={!!errores.fin}
              />
            </Field>
          </div>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
            Hora de Colombia. Si la franja ya está reservada, te lo diremos al enviar.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
          <CardDescription>
            Tu nombre y correo se toman de tu cuenta institucional. Los volverás a ver al recibir el
            espacio.
          </CardDescription>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Rol</span>
            <Segmented
              nombre="rol"
              etiqueta="Rol"
              opciones={ROLES_RECEPTOR.map((r) => ({ valor: r, etiqueta: ETIQUETAS_ROL[r] }))}
              valor={rol}
              onCambio={setRol}
            />
            {errores.rol && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errores.rol}
              </p>
            )}
          </div>
          <Field id="dependencia" label="Dependencia o programa" error={errores.dependencia}>
            <Input
              id="dependencia"
              maxLength={LIMITES.dependenciaMax}
              placeholder="Ej. Contaduría Pública"
              value={dependencia}
              onChange={(e) => setDependencia(e.target.value)}
              aria-invalid={!!errores.dependencia}
            />
          </Field>
          <Field id="cargo" label="Cargo" opcional error={errores.cargo}>
            <Input
              id="cargo"
              maxLength={LIMITES.cargoMax}
              placeholder="Ej. Coordinadora académica"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="celular" label="Celular" error={errores.celular}>
              <Input
                id="celular"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="3001234567"
                value={celular}
                onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
                aria-invalid={!!errores.celular}
              />
            </Field>
            <Field
              id="asistentesEstimados"
              label="Asistentes estimados"
              hint={`Capacidad: ${espacio.capacidad} personas.`}
              error={errores.asistentesEstimados}
            >
              <Input
                id="asistentesEstimados"
                inputMode="numeric"
                placeholder="Ej. 80"
                value={asistentes}
                onChange={(e) => setAsistentes(e.target.value.replace(/\D/g, ''))}
                aria-invalid={!!errores.asistentesEstimados}
              />
            </Field>
          </div>
          {Number(asistentes) > espacio.capacidad && (
            <Alert tono="oro" icono={<TriangleAlert />}>
              Superas la capacidad del espacio ({espacio.capacidad}). Coordínalo con
              Infraestructura.
            </Alert>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autorización de datos</CardTitle>
          <CardDescription>
            Necesaria para registrar tu solicitud (Ley 1581 de 2012).
          </CardDescription>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Checkbox
            id="autorizaDatos"
            checked={autorizaDatos}
            onChange={(e) => setAutorizaDatos(e.target.checked)}
            aria-invalid={!!errores.autorizaDatos}
          >
            {terminos.tratamientoDatos}
          </Checkbox>
          {errores.autorizaDatos && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errores.autorizaDatos}
            </p>
          )}
        </CardBody>
        <CardFooter className="flex-col items-stretch sm:flex-row sm:items-center">
          {errores.servidor && (
            <p role="alert" className="text-sm font-medium text-destructive sm:mr-auto">
              {errores.servidor}
            </p>
          )}
          <Button type="submit" variante="primario" tamano="lg" disabled={enviando}>
            <Send aria-hidden />
            {enviando
              ? 'Enviando…'
              : asignacion.estado === 'RECHAZADA'
                ? 'Enviar corrección'
                : 'Enviar solicitud'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
