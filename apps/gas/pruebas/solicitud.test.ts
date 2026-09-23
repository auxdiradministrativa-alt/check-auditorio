import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { test } from 'node:test'

import type { Entrada, Respuesta } from '@check-auditorio/shared/sin-zod'

import { crearNucleoMemoria } from '../src/infraestructura/memoria'

/*
 * Flujo por enlace personal (spec 2026-09-23). Cada regla de seguridad tiene su prueba de
 * control negativo: si se quita la guarda, la prueba se pone roja.
 */

const sha = (t: string) => createHash('sha256').update(t).digest('hex')
const infra = { nombre: 'Infraestructura', correo: 'auxdiradministrativa@americana.edu.co' }
const laura = { nombre: 'Laura Pérez', correo: 'laura.perez@americana.edu.co', sub: 'sub-laura' }
const intruso = { nombre: 'Otro', correo: 'otro@americana.edu.co', sub: 'sub-otro' }

function ok<T>(r: Respuesta<T>): T {
  if (!r.ok) assert.fail(`${r.codigo}: ${r.mensaje}`)
  return r.datos
}
const codigo = (r: Respuesta<unknown>) => (r.ok ? 'OK' : r.codigo)

/** Reloj que las pruebas mueven a voluntad. */
function preparar(inicioReloj = '2026-09-15T08:00:00-05:00') {
  let ahora = new Date(inicioReloj)
  const { nucleo, tabla } = crearNucleoMemoria({ ahora: () => ahora, secreto: 's' })
  const mover = (iso: string) => (ahora = new Date(iso))

  const invitar = (correo = laura.correo) => {
    const token = randomUUID()
    const a = ok(
      nucleo.ejecutar('invitacion.crear', {
        id: randomUUID(),
        correoSolicitante: correo,
        referencia: 'Foro de contaduría',
        entregadoPor: infra,
        tokenSha256: sha(token),
      }),
    )
    return { a, tokenSha256: sha(token) }
  }

  const datos = (
    inicio = '2026-09-15T10:00:00-05:00',
    fin = '2026-09-15T12:00:00-05:00',
  ): Entrada<'solicitud.diligenciar'>['datos'] => ({
    evento: 'Foro de contaduría',
    inicio,
    fin,
    rol: 'DOCENTE',
    dependencia: 'Contaduría',
    cargo: '',
    celular: '3001234567',
    asistentesEstimados: 80,
    autorizaDatos: true,
  })

  const diligenciar = (id: string, quien = laura, d = datos()) =>
    nucleo.ejecutar('solicitud.diligenciar', { id, receptor: quien, datos: d })

  const decidir = (id: string, decision: 'APROBAR' | 'RECHAZAR', version: string, motivo = '') =>
    nucleo.ejecutar('solicitud.decidir', { id, decision, motivo, version, actor: infra })

  const checklist = () =>
    ok(nucleo.ejecutar('catalogo.listar', {})).elementos.map((e) => ({
      elementoId: e.id,
      cantidadRecibida: e.cantidadEsperada,
      estado: 'CONFORME' as const,
      observacion: '',
      fotoIds: [],
    }))

  return { nucleo, tabla, mover, invitar, datos, diligenciar, decidir, checklist }
}

test('camino feliz: invitar → diligenciar → aprobar → confirmar → sello íntegro → devolver', () => {
  const p = preparar()
  const { a } = p.invitar()
  assert.equal(a.estado, 'INVITADA')
  assert.equal(a.invitadoCorreo, laura.correo)

  const s = ok(p.diligenciar(a.id))
  assert.equal(s.estado, 'SOLICITADA')
  assert.equal(s.solicitud?.celular, '3001234567')

  const aprobada = ok(p.decidir(a.id, 'APROBAR', s.solicitadaEn!))
  assert.equal(aprobada.estado, 'PROGRAMADA')

  p.mover('2026-09-15T09:45:00-05:00')
  assert.equal(
    ok(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: laura })).estado,
    'EN_DILIGENCIAMIENTO',
  )
  const sello = ok(
    p.nucleo.ejecutar('recepcion.registrar', {
      asignacionId: a.id,
      receptor: laura,
      userAgent: 'test',
      datos: {
        claveIdempotencia: randomUUID(),
        rol: 'DOCENTE',
        dependencia: 'Contaduría',
        cargo: '',
        celular: '3001234567',
        asistentesEstimados: 80,
        checklist: p.checklist(),
        aceptaTerminos: true,
        autorizaDatos: true,
      },
    }),
  )
  const constancia = ok(p.nucleo.ejecutar('constancia.obtener', { consecutivo: sello.consecutivo }))
  assert.equal(constancia?.integra, true)

  const devuelta = ok(
    p.nucleo.ejecutar('devolucion.registrar', {
      asignacionId: a.id,
      receptor: laura,
      datos: {
        claveIdempotencia: randomUUID(),
        resultado: 'BUENAS_CONDICIONES',
        novedades: [],
        declaracion: true,
      },
    }),
  )
  assert.equal(devuelta.estado, 'DEVUELTA')
})

test('el enlace es personal: otra cuenta no diligencia ni confirma, tampoco por la puerta vieja', () => {
  const p = preparar()
  const { a, tokenSha256 } = p.invitar()
  assert.equal(codigo(p.diligenciar(a.id, intruso)), 'NO_AUTORIZADO')
  // Mayúsculas en el correo de la sesión no cuentan como otra cuenta.
  const s = ok(p.diligenciar(a.id, { ...laura, correo: 'Laura.Perez@americana.edu.co' }))
  ok(p.decidir(a.id, 'APROBAR', s.solicitadaEn!))
  p.mover('2026-09-15T09:45:00-05:00')

  // Hallazgo 1 del revisor: `qr.reclamar` sobre una fila con invitado debe rechazarse.
  assert.equal(
    codigo(p.nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: intruso })),
    'NO_AUTORIZADO',
  )
  assert.equal(
    codigo(p.nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: laura })),
    'NO_AUTORIZADO',
  )
  assert.equal(
    codigo(
      p.nucleo.ejecutar('validacion.decidir', { id: a.id, decision: 'CONFIRMAR', actor: infra }),
    ),
    'ESTADO_INVALIDO',
  )
  assert.equal(
    codigo(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: intruso })),
    'NO_AUTORIZADO',
  )
  // Misma dirección, otra cuenta de Google (otro `sub`): tampoco.
  assert.equal(
    codigo(
      p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: { ...laura, sub: 'otra' } }),
    ),
    'NO_AUTORIZADO',
  )
})

test('diligenciar solo desde INVITADA o RECHAZADA: nada cambia una solicitud enviada o aprobada', () => {
  const p = preparar()
  const { a } = p.invitar()
  const s = ok(p.diligenciar(a.id))
  const otraFranja = p.datos('2026-09-15T14:00:00-05:00', '2026-09-15T22:00:00-05:00')
  assert.equal(codigo(p.diligenciar(a.id, laura, otraFranja)), 'ESTADO_INVALIDO', 'en revisión')
  ok(p.decidir(a.id, 'APROBAR', s.solicitadaEn!))
  assert.equal(codigo(p.diligenciar(a.id, laura, otraFranja)), 'ESTADO_INVALIDO', 'aprobada')
  assert.equal(
    ok(p.nucleo.ejecutar('asignacion.obtener', { id: a.id }))?.inicio,
    '2026-09-15T10:00:00-05:00',
  )
})

test('rechazar con motivo devuelve para corregir; el gestor aprueba solo la versión que vio', () => {
  const p = preparar()
  const { a } = p.invitar()
  const v1 = ok(p.diligenciar(a.id)).solicitadaEn!
  assert.equal(codigo(p.decidir(a.id, 'RECHAZAR', v1, 'no')), 'DATOS_INVALIDOS', 'motivo corto')
  const rechazada = ok(p.decidir(a.id, 'RECHAZAR', v1, 'La hora de inicio no coincide con la sala'))
  assert.equal(rechazada.estado, 'RECHAZADA')
  assert.equal(rechazada.motivoRechazo, 'La hora de inicio no coincide con la sala')

  p.mover('2026-09-15T08:05:00-05:00')
  const v2 = ok(
    p.diligenciar(a.id, laura, p.datos('2026-09-15T11:00:00-05:00', '2026-09-15T13:00:00-05:00')),
  ).solicitadaEn!
  assert.notEqual(v1, v2)
  // Otro gestor dejó la pantalla abierta con la versión 1: su aprobación no pasa.
  assert.equal(codigo(p.decidir(a.id, 'APROBAR', v1)), 'ESTADO_INVALIDO')
  const aprobada = ok(p.decidir(a.id, 'APROBAR', v2))
  assert.equal(aprobada.estado, 'PROGRAMADA')
  assert.equal(aprobada.motivoRechazo, null)
  assert.equal(codigo(p.decidir(a.id, 'APROBAR', v2)), 'ESTADO_INVALIDO', 'no se aprueba dos veces')
})

test('franja: pendientes no bloquean; al aprobar gana la primera y la segunda falla', () => {
  const p = preparar()
  const uno = p.invitar()
  const dos = p.invitar('otro@americana.edu.co')
  const v1 = ok(p.diligenciar(uno.a.id)).solicitadaEn!
  const v2 = ok(p.diligenciar(dos.a.id, intruso)).solicitadaEn!
  ok(p.decidir(uno.a.id, 'APROBAR', v1))
  const r = p.decidir(dos.a.id, 'APROBAR', v2)
  assert.equal(codigo(r), 'DATOS_INVALIDOS')
  assert.match(r.ok ? '' : r.mensaje, /ya está reservado de 10:00 a 12:00/)
  // El mensaje no revela el nombre del otro evento.
  assert.doesNotMatch(r.ok ? '' : r.mensaje, /Foro/)
  // Tras aprobar la primera, una nueva solicitud en esa franja se avisa al diligenciar.
  const tres = p.invitar('tres@americana.edu.co')
  assert.equal(
    codigo(p.diligenciar(tres.a.id, { ...intruso, correo: 'tres@americana.edu.co', sub: 's3' })),
    'DATOS_INVALIDOS',
  )
})

test('vencimientos: la invitación caduca a las 72 h; la solicitud vive hasta el inicio propuesto', () => {
  const p = preparar()
  const { a } = p.invitar()
  p.mover('2026-09-18T08:00:01-05:00')
  assert.equal(ok(p.nucleo.ejecutar('asignacion.obtener', { id: a.id }))?.estado, 'EXPIRADA')
  assert.equal(codigo(p.diligenciar(a.id)), 'ESTADO_INVALIDO')

  const q = preparar()
  const b = q.invitar()
  const v = ok(
    q.diligenciar(b.a.id, laura, q.datos('2026-09-20T10:00:00-05:00', '2026-09-20T12:00:00-05:00')),
  ).solicitadaEn!
  // Hallazgo 5: pasan más de 72 h con el gestor sin responder y la solicitud sigue viva.
  q.mover('2026-09-19T08:00:00-05:00')
  assert.equal(ok(q.nucleo.ejecutar('asignacion.obtener', { id: b.a.id }))?.estado, 'SOLICITADA')
  // Llega la hora de inicio sin aprobación: vence y ya no se puede aprobar.
  q.mover('2026-09-20T10:00:01-05:00')
  assert.equal(codigo(q.decidir(b.a.id, 'APROBAR', v)), 'ESTADO_INVALIDO')
})

test('la vista trae los plazos que decide la hoja: la web no los repite', () => {
  const p = preparar()
  // Infraestructura cambia los plazos en CFG_General: la web debe mostrar estos, no 72 h ni 30 min.
  p.tabla.actualizar('CFG_General', 'clave', 'horas_vigencia_invitacion', { valor: '48' })
  p.tabla.actualizar('CFG_General', 'clave', 'minutos_vigencia_qr_antes', { valor: '15' })
  const { a } = p.invitar()
  assert.equal(a.tokenVence, '2026-09-17T08:00:00-05:00', 'invitada: emisión + 48 h')

  const s = ok(p.diligenciar(a.id))
  assert.equal(s.tokenVence, '2026-09-15T10:00:00-05:00', 'solicitada: hasta el inicio propuesto')
  assert.equal(s.recepcionDesde, '2026-09-15T09:45:00-05:00', 'inicio − 15 min')

  const aprobada = ok(p.decidir(a.id, 'APROBAR', s.solicitadaEn!))
  assert.equal(aprobada.tokenVence, '2026-09-15T12:00:00-05:00', 'aprobada: hasta el fin')

  // La hora que se muestra es la misma en que el núcleo abre la recepción.
  const qr = ok(p.nucleo.ejecutar('asignacion.obtener', { id: a.id }))!
  p.mover(new Date(new Date(qr.recepcionDesde).getTime() - 1000).toISOString())
  assert.equal(
    codigo(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: laura })),
    'QR_NO_VIGENTE',
  )
  p.mover(qr.recepcionDesde)
  ok(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: laura }))
})

test('confirmar la recepción solo dentro de la vigencia; entrar dos veces es idempotente', () => {
  const p = preparar()
  const { a } = p.invitar()
  ok(p.decidir(a.id, 'APROBAR', ok(p.diligenciar(a.id)).solicitadaEn!))
  assert.equal(
    codigo(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: laura })),
    'QR_NO_VIGENTE',
  )
  p.mover('2026-09-15T09:30:00-05:00')
  ok(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: laura }))
  assert.equal(
    ok(p.nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor: laura })).estado,
    'EN_DILIGENCIAMIENTO',
  )
})

test('la autorización guarda versión y huella del texto aceptado (Ley 1581)', () => {
  const p = preparar()
  const { a } = p.invitar()
  ok(p.diligenciar(a.id))
  const fila = p.tabla.leer('Asignaciones').find((f) => f.id === a.id)!
  assert.equal(fila.autoriza_datos_version, 'v0.1-borrador')
  assert.match(fila.autoriza_datos_sha256, /^[0-9a-f]{64}$/)
  assert.equal(fila.autoriza_datos_en, fila.solicitada_en)
})

test('datos inválidos se rechazan en el núcleo aunque la web los deje pasar', () => {
  const p = preparar()
  const { a } = p.invitar()
  const base = p.datos()
  assert.equal(codigo(p.diligenciar(a.id, laura, { ...base, celular: '12345' })), 'DATOS_INVALIDOS')
  assert.equal(
    codigo(
      p.diligenciar(a.id, laura, p.datos('2026-09-15T07:00:00-05:00', '2026-09-15T09:00:00-05:00')),
    ),
    'DATOS_INVALIDOS',
    'evento en el pasado',
  )
  assert.equal(
    codigo(p.diligenciar(a.id, laura, { ...base, autorizaDatos: false as unknown as true })),
    'DATOS_INVALIDOS',
  )
  assert.equal(
    codigo(
      p.nucleo.ejecutar('invitacion.crear', {
        id: randomUUID(),
        correoSolicitante: 'alguien@gmail.com',
        referencia: '',
        entregadoPor: infra,
        tokenSha256: sha('x'),
      }),
    ),
    'DATOS_INVALIDOS',
  )
})

test('un segundo espacio activo detiene la invitación en vez de elegir uno en silencio', () => {
  const p = preparar()
  p.tabla.agregar('CAT_Espacios', [
    { id: 'esp-2', nombre: 'Sala 2', ubicacion: 'Prado', capacidad: '20', activo: 'SI' },
  ])
  const r = p.nucleo.ejecutar('invitacion.crear', {
    id: randomUUID(),
    correoSolicitante: laura.correo,
    referencia: '',
    entregadoPor: infra,
    tokenSha256: sha('y'),
  })
  assert.equal(codigo(r), 'INTERNO')
})
