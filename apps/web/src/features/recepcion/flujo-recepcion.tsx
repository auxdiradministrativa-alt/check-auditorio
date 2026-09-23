'use client'

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Send,
  TriangleAlert,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type {
  Asignacion,
  ElementoCatalogo,
  Espacio,
  Persona,
  Terminos,
} from '@check-auditorio/shared'
import {
  ETIQUETAS_ROL,
  LIMITES,
  recepcionInputSchema,
  ROLES_RECEPTOR,
} from '@check-auditorio/shared'

import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, Input } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { Stepper } from '@/components/ui/stepper'
import { formatearFechaLarga, formatearFranja } from '@/lib/fechas'
import { uuid } from '@/lib/uuid'

import { cerrarSesion } from '@/features/auth/acciones'

import { firmarRecepcion } from './acciones'
import { ItemChecklist } from './item-checklist'
import type { DatosReceptor, ErroresItem, ItemEstado } from './tipos'
import { aItemInput, validarDatos, validarItems, type ErroresDatos } from './validacion'

const PASOS = ['Identidad', 'Tus datos', 'Estado del auditorio', 'Términos', 'Revisar'] as const

export function FlujoRecepcion({
  token,
  asignacion,
  espacio,
  catalogo,
  sesion,
  terminos,
}: {
  token: string
  asignacion: Asignacion
  espacio: Espacio
  catalogo: ElementoCatalogo[]
  sesion: Persona
  terminos: Terminos
}) {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [claveIdempotencia] = useState(uuid)
  // Flujo por enlace: lo diligenciado en la solicitud se precarga y la persona solo lo revisa.
  const [datos, setDatos] = useState<DatosReceptor>(() => {
    const s = asignacion.solicitud
    return {
      rol: s?.rol ?? null,
      dependencia: s?.dependencia ?? '',
      cargo: s?.cargo ?? '',
      celular: s?.celular ?? '',
      asistentesEstimados: s ? String(s.asistentesEstimados) : '',
    }
  })
  const [items, setItems] = useState<Record<string, ItemEstado>>(() =>
    Object.fromEntries(catalogo.map((el) => [el.id, { estado: null, observacion: '', fotos: [] }])),
  )
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [autorizaDatos, setAutorizaDatos] = useState(false)
  const [erroresDatos, setErroresDatos] = useState<ErroresDatos>({})
  const [erroresItems, setErroresItems] = useState<Record<string, ErroresItem>>({})
  const [errorTerminos, setErrorTerminos] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [reautenticar, setReautenticar] = useState(false)
  const [avisoTodoConforme, setAvisoTodoConforme] = useState<string | null>(null)

  // Libera las vistas previas de fotos al salir del flujo.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(
    () => () => {
      for (const item of Object.values(itemsRef.current)) {
        for (const f of item.fotos) URL.revokeObjectURL(f.url)
      }
    },
    [],
  )

  function irA(n: number) {
    setPaso(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function actualizarItem(id: string, cambio: (previo: ItemEstado) => ItemEstado) {
    setItems((prev) => ({ ...prev, [id]: cambio(prev[id]!) }))
    if (erroresItems[id]) {
      setErroresItems((prev) => {
        const resto = { ...prev }
        delete resto[id]
        return resto
      })
    }
  }

  /**
   * Atajo «Todo en buen estado»: todos los aspectos quedan CONFORME. No pisa una novedad ya
   * descrita con sus fotos: esa se conserva. Cualquiera puede volver a cambiarse a Novedad.
   */
  function marcarTodoEnBuenEstado() {
    const conNovedad = catalogo.filter((el) => items[el.id]?.estado === 'NOVEDAD').length
    setItems((prev) => {
      const next = { ...prev }
      for (const el of catalogo) {
        const actual = next[el.id]
        if (!actual || actual.estado === 'NOVEDAD') continue
        next[el.id] = { ...actual, estado: 'CONFORME' }
      }
      return next
    })
    setErroresItems({})
    setAvisoTodoConforme(
      conNovedad
        ? `Marcamos el resto como conforme y conservamos ${conNovedad} con novedad. Revisa y continúa.`
        : 'Marcamos todo como conforme. Si algo no está bien, cámbialo a Novedad.',
    )
  }

  function continuar() {
    if (paso === 1) {
      const e = validarDatos(datos)
      setErroresDatos(e)
      if (Object.keys(e).length) return
    }
    if (paso === 2) {
      const e = validarItems(catalogo, items)
      setErroresItems(e)
      const primero = Object.keys(e)[0]
      if (primero) {
        document
          .getElementById(`item-${primero}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    if (paso === 3) {
      if (!aceptaTerminos || !autorizaDatos) {
        setErrorTerminos(
          'Debes aceptar los términos y autorizar el tratamiento de datos para continuar.',
        )
        return
      }
      setErrorTerminos(null)
    }
    irA(paso + 1)
  }

  async function enviar() {
    const payload = {
      claveIdempotencia,
      rol: datos.rol,
      dependencia: datos.dependencia,
      cargo: datos.cargo,
      celular: datos.celular,
      asistentesEstimados: Number(datos.asistentesEstimados),
      checklist: catalogo.map((el) => aItemInput(el, items[el.id]!)),
      aceptaTerminos,
      autorizaDatos,
    }
    const r = recepcionInputSchema.safeParse(payload)
    if (!r.success) {
      setErrorTerminos('Hay datos por corregir. Revisa los pasos anteriores.')
      return
    }
    setEnviando(true)
    setErrorTerminos(null)
    const resultado = await firmarRecepcion(token, r.data)
    if (resultado.ok) {
      router.push(`/r/${token}/confirmada`)
      return
    }
    setEnviando(false)
    setReautenticar(resultado.codigo === 'REAUTENTICAR' || resultado.codigo === 'SESION')
    setErrorTerminos(resultado.mensaje)
  }

  const novedades = catalogo.filter((el) => items[el.id]?.estado === 'NOVEDAD')
  const revisados = catalogo.filter((el) => items[el.id]?.estado !== null).length

  return (
    <div className="flex flex-col gap-6 pb-28">
      <Stepper pasos={PASOS} actual={paso} />

      {paso === 0 && (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-page sm:text-page-lg">Recepción del espacio</h1>
            <p className="text-muted-foreground">
              Vas a dejar constancia del estado en que recibes el espacio. Tu cuenta institucional
              funciona como firma.
            </p>
          </div>
          <Card>
            <CardBody className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Avatar nombre={sesion.nombre} className="size-12 text-base" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-semibold">{sesion.nombre}</p>
                <p className="truncate text-sm text-muted-foreground">{sesion.correo}</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-success">
                <BadgeCheck className="size-4" aria-hidden />
                Identidad validada
              </span>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-muted-foreground">Entrega</p>
              <CardTitle>{asignacion.evento}</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <dt>
                    <MapPin className="size-4 text-primary" aria-label="Espacio" />
                  </dt>
                  <dd>
                    {espacio.nombre} · {espacio.ubicacion}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt>
                    <CalendarDays className="size-4 text-primary" aria-label="Fecha" />
                  </dt>
                  <dd className="first-letter:uppercase">
                    {formatearFechaLarga(asignacion.inicio)}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt>
                    <Clock className="size-4 text-primary" aria-label="Horario" />
                  </dt>
                  <dd className="tabular">{formatearFranja(asignacion.inicio, asignacion.fin)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt>
                    <BadgeCheck className="size-4 text-primary" aria-label="Entrega" />
                  </dt>
                  <dd>Entrega {asignacion.entregadoPor.nombre}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </>
      )}

      {paso === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tus datos</CardTitle>
            <CardDescription>
              Tu nombre y correo se toman de tu cuenta institucional.
            </CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold" id="rol-label">
                Rol
              </span>
              <Segmented
                nombre="rol"
                etiqueta="Rol"
                opciones={ROLES_RECEPTOR.map((r) => ({ valor: r, etiqueta: ETIQUETAS_ROL[r] }))}
                valor={datos.rol}
                onCambio={(rol) => setDatos({ ...datos, rol })}
              />
              {erroresDatos.rol && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {erroresDatos.rol}
                </p>
              )}
            </div>
            <Field id="dependencia" label="Dependencia o programa" error={erroresDatos.dependencia}>
              <Input
                id="dependencia"
                maxLength={LIMITES.dependenciaMax}
                placeholder="Ej. Contaduría Pública"
                value={datos.dependencia}
                onChange={(e) => setDatos({ ...datos, dependencia: e.target.value })}
                aria-invalid={!!erroresDatos.dependencia}
              />
            </Field>
            <Field id="cargo" label="Cargo" opcional error={erroresDatos.cargo}>
              <Input
                id="cargo"
                maxLength={LIMITES.cargoMax}
                placeholder="Ej. Coordinadora académica"
                value={datos.cargo}
                onChange={(e) => setDatos({ ...datos, cargo: e.target.value })}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="celular" label="Celular" error={erroresDatos.celular}>
                <Input
                  id="celular"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="3001234567"
                  value={datos.celular}
                  onChange={(e) =>
                    setDatos({ ...datos, celular: e.target.value.replace(/\D/g, '') })
                  }
                  aria-invalid={!!erroresDatos.celular}
                />
              </Field>
              <Field
                id="asistentes"
                label="Asistentes estimados"
                hint={`Capacidad: ${espacio.capacidad} personas.`}
                error={erroresDatos.asistentesEstimados}
              >
                <Input
                  id="asistentes"
                  inputMode="numeric"
                  placeholder="Ej. 80"
                  value={datos.asistentesEstimados}
                  onChange={(e) =>
                    setDatos({ ...datos, asistentesEstimados: e.target.value.replace(/\D/g, '') })
                  }
                  aria-invalid={!!erroresDatos.asistentesEstimados}
                />
              </Field>
            </div>
            {Number(datos.asistentesEstimados) > espacio.capacidad && (
              <Alert tono="oro" icono={<TriangleAlert />}>
                Superas la capacidad del espacio ({espacio.capacidad}). Coordínalo con
                Infraestructura.
              </Alert>
            )}
          </CardBody>
        </Card>
      )}

      {paso === 2 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-section">Estado del auditorio</h2>
            <p className="text-sm text-muted-foreground">
              Revisa cada aspecto del espacio al recibirlo. Si algo está dañado o no funciona, marca
              Novedad y toma una foto.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-success/20 bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5 text-sm">
              <p className="font-semibold text-success">¿Todo está en buen estado?</p>
              <p className="text-foreground">
                Marca como conformes todos los aspectos. Después puedes cambiar cualquiera a
                Novedad.
              </p>
            </div>
            <Button variante="secundario" className="shrink-0" onClick={marcarTodoEnBuenEstado}>
              <BadgeCheck aria-hidden />
              Todo en buen estado
            </Button>
          </div>
          {avisoTodoConforme && (
            <p role="status" className="text-sm text-muted-foreground">
              {avisoTodoConforme}
            </p>
          )}
          <p className="text-sm font-medium text-primary-strong tabular" aria-live="polite">
            {revisados} de {catalogo.length} revisados
          </p>
          <ul className="flex flex-col gap-3">
            {catalogo.map((el) => (
              <ItemChecklist
                key={el.id}
                asignacionId={asignacion.id}
                elemento={el}
                valor={items[el.id]!}
                errores={erroresItems[el.id]}
                onCambio={(cambio) => actualizarItem(el.id, cambio)}
              />
            ))}
          </ul>
        </section>
      )}

      {paso === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Términos y condiciones de la entrega</CardTitle>
            <CardDescription>
              Versión <span className="font-semibold tabular">{terminos.version}</span> · léelos
              antes de aceptar.
            </CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Alert tono="oro" icono={<TriangleAlert />} titulo="Texto de ejemplo">
              Pendiente de revisión por Jurídica antes de publicar.
            </Alert>
            <ol
              tabIndex={0}
              aria-label="Cláusulas"
              className="flex max-h-80 list-decimal flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-card py-4 pr-4 pl-9 text-sm leading-relaxed text-foreground"
            >
              {terminos.clausulas.map((c) => (
                <li key={c} className="pl-1 marker:font-semibold marker:text-attention">
                  {c}
                </li>
              ))}
            </ol>
            <Checkbox
              id="acepta"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            >
              Leí y acepto los términos y condiciones de la entrega (versión {terminos.version}).
            </Checkbox>
            <Checkbox
              id="datos"
              checked={autorizaDatos}
              onChange={(e) => setAutorizaDatos(e.target.checked)}
            >
              {terminos.tratamientoDatos}
            </Checkbox>
            {errorTerminos && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {errorTerminos}
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {paso === 4 && (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-section">Revisa y envía</h2>
            <p className="text-sm text-muted-foreground">
              Al enviar, la constancia queda sellada y no se puede modificar.
            </p>
          </div>
          <Card>
            <CardBody>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Recibe</dt>
                  <dd className="font-semibold">{sesion.nombre}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Rol y dependencia</dt>
                  <dd className="font-semibold">
                    {datos.rol && ETIQUETAS_ROL[datos.rol]} · {datos.dependencia}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Evento</dt>
                  <dd className="font-semibold">{asignacion.evento}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Asistentes estimados</dt>
                  <dd className="font-semibold tabular">{datos.asistentesEstimados}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Aspectos verificados</dt>
                  <dd className="font-semibold tabular">
                    {catalogo.length - novedades.length} conformes · {novedades.length} con novedad
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Términos</dt>
                  <dd className="font-semibold">Aceptados · {terminos.version}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
          {novedades.length > 0 && (
            <Card className="border-destructive/25">
              <CardHeader>
                <CardTitle>Novedades reportadas</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="flex flex-col divide-y divide-border">
                  {novedades.map((el) => (
                    <li key={el.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                      <span className="font-semibold">{el.nombre}</span>
                      <span className="text-sm text-muted-foreground">
                        {items[el.id]?.observacion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {items[el.id]?.fotos.length} foto(s)
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {enviando && (
            <Alert
              tono="info"
              icono={<Loader2 className="animate-spin" aria-hidden />}
              titulo="Sellando la constancia"
            >
              Estamos guardando el registro y calculando su sello. Puede tardar unos segundos; no
              cierres esta pantalla.
            </Alert>
          )}
          {errorTerminos && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errorTerminos}
            </p>
          )}
          {reautenticar && (
            <form action={cerrarSesion}>
              <input type="hidden" name="destino" value={`/r/${token}`} />
              <Button type="submit" variante="secundario">
                Volver a iniciar sesión
              </Button>
            </form>
          )}
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3 sm:px-6">
          {paso > 0 && (
            <Button
              variante="secundario"
              tamano="lg"
              onClick={() => irA(paso - 1)}
              disabled={enviando}
            >
              <ArrowLeft aria-hidden />
              <span className="sr-only sm:not-sr-only">Atrás</span>
            </Button>
          )}
          {paso < PASOS.length - 1 ? (
            <Button variante="primario" tamano="lg" bloque onClick={continuar}>
              {paso === 0 ? 'Comenzar' : 'Continuar'}
              <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button variante="oro" tamano="lg" bloque onClick={enviar} disabled={enviando}>
              <Send aria-hidden />
              {enviando ? 'Enviando…' : 'Confirmar recepción'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
