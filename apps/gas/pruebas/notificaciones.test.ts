import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { test } from 'node:test'

import type { Respuesta } from '@check-auditorio/shared/sin-zod'

import type { Correo, Mensaje } from '../src/aplicacion/puertos'
import { crearNucleoMemoria } from '../src/infraestructura/memoria'

const sha = (t: string) => createHash('sha256').update(t).digest('hex')
const infra = { nombre: 'Infraestructura', correo: 'auxdiradministrativa@americana.edu.co' }
const laura = { nombre: 'Laura Pérez', correo: 'laura.perez@americana.edu.co', sub: 'sub-laura' }

function ok<T>(r: Respuesta<T>): T {
  if (!r.ok) assert.fail(`${r.codigo}: ${r.mensaje}`)
  return r.datos
}

/** Correo falso: guarda lo enviado; puede fallar a voluntad o quedarse sin cuota. */
function correoFalso() {
  const enviados: Mensaje[] = []
  let fallar = false
  let cuota = 100
  const correo: Correo = {
    enviar: (m) => {
      if (fallar) throw new Error('SMTP caído')
      enviados.push(m)
      cuota -= m.para.length
    },
    cuotaRestante: () => cuota,
  }
  return {
    correo,
    enviados,
    fallar: (v: boolean) => (fallar = v),
    cuota: (n: number) => (cuota = n),
  }
}

function preparar() {
  let ahora = new Date('2026-09-15T08:00:00-05:00')
  const { nucleo, tabla } = crearNucleoMemoria({ ahora: () => ahora })
  const mover = (iso: string) => (ahora = new Date(iso))
  const aprobada = () => {
    const a = ok(
      nucleo.ejecutar('invitacion.crear', {
        id: randomUUID(),
        correoSolicitante: laura.correo,
        referencia: '',
        entregadoPor: infra,
        tokenSha256: sha(randomUUID()),
      }),
    )
    const s = ok(
      nucleo.ejecutar('solicitud.diligenciar', {
        id: a.id,
        receptor: laura,
        datos: {
          evento: 'Foro <b>de</b> contaduría',
          inicio: '2026-09-15T10:00:00-05:00',
          fin: '2026-09-15T12:00:00-05:00',
          rol: 'DOCENTE',
          dependencia: 'Contaduría',
          cargo: '',
          celular: '3001234567',
          asistentesEstimados: 80,
          autorizaDatos: true,
        },
      }),
    )
    ok(
      nucleo.ejecutar('solicitud.decidir', {
        id: a.id,
        decision: 'APROBAR',
        motivo: '',
        version: s.solicitadaEn!,
        actor: infra,
      }),
    )
    return a.id
  }
  const notif = (id: string) => tabla.leer('Asignaciones').find((f) => f.id === id)!
  return { nucleo, tabla, mover, aprobada, notif }
}

test('aprobar avisa al solicitante; la confirmación sale solo desde la hora de inicio', () => {
  const p = preparar()
  const c = correoFalso()
  const id = p.aprobada()

  const r1 = p.nucleo.procesarNotificaciones(c.correo)
  assert.equal(r1.enviados, 1, 'solo el aviso de aprobación')
  assert.match(c.enviados[0]!.asunto, /Solicitud aprobada/)
  assert.deepEqual(c.enviados[0]!.para, [laura.correo])
  assert.equal(p.notif(id).notif_decision, 'ENVIADO')
  assert.equal(p.notif(id).notif_confirmacion, 'PENDIENTE')

  p.mover('2026-09-15T09:59:00-05:00')
  assert.equal(p.nucleo.procesarNotificaciones(c.correo).enviados, 0, 'aún no empieza')
  p.mover('2026-09-15T10:00:00-05:00')
  assert.equal(p.nucleo.procesarNotificaciones(c.correo).enviados, 1)
  assert.match(c.enviados[1]!.asunto, /Confirma la recepción/)
  assert.match(c.enviados[1]!.html, new RegExp(`/mi-solicitud/${id}`))
  assert.doesNotMatch(c.enviados[1]!.html, /<b>de<\/b>/, 'texto del usuario escapado')
  assert.equal(p.nucleo.procesarNotificaciones(c.correo).enviados, 0, 'un solo correo por fila')
})

test('si ya confirmó antes del correo, la confirmación se omite', () => {
  const p = preparar()
  const c = correoFalso()
  const id = p.aprobada()
  p.mover('2026-09-15T09:40:00-05:00')
  ok(p.nucleo.ejecutar('recepcion.iniciar', { id, receptor: laura }))
  p.mover('2026-09-15T10:05:00-05:00')
  p.nucleo.procesarNotificaciones(c.correo)
  assert.equal(p.notif(id).notif_confirmacion, 'OMITIDO')
  assert.ok(c.enviados.every((m) => !/Confirma la recepción/.test(m.asunto)))
})

test('fallos: reintenta y al tercero queda FALLIDO con bitácora', () => {
  const p = preparar()
  const c = correoFalso()
  const id = p.aprobada()
  c.fallar(true)
  p.nucleo.procesarNotificaciones(c.correo)
  p.nucleo.procesarNotificaciones(c.correo)
  assert.equal(p.notif(id).notif_decision, 'PENDIENTE')
  assert.equal(p.notif(id).notif_decision_intentos, '2')
  const r = p.nucleo.procesarNotificaciones(c.correo)
  assert.equal(r.fallidos, 1)
  assert.equal(p.notif(id).notif_decision, 'FALLIDO')
  assert.ok(p.tabla.leer('Bitacora').some((b) => b.evento === 'notificacion.fallida'))
  c.fallar(false)
  assert.equal(
    p.nucleo.procesarNotificaciones(c.correo).enviados,
    0,
    'FALLIDO no se reintenta solo',
  )
})

test('sin cuota no se gasta intento; una reserva viva no se toma dos veces', () => {
  const p = preparar()
  const c = correoFalso()
  const id = p.aprobada()
  c.cuota(0)
  const r = p.nucleo.procesarNotificaciones(c.correo)
  assert.equal(r.reintentar, 1)
  assert.equal(p.notif(id).notif_decision, 'PENDIENTE')
  assert.equal(p.notif(id).notif_decision_intentos, '0')

  // Otro turno dejó la fila reservada hace un minuto: este turno no la toca.
  c.cuota(100)
  p.tabla.actualizar('Asignaciones', 'id', id, {
    notif_decision: 'ENVIANDO',
    notif_decision_reserva: '2026-09-15T08:09:00-05:00',
  })
  assert.equal(p.nucleo.procesarNotificaciones(c.correo).enviados, 0)
  // Vencida la reserva (el turno murió), se retoma.
  p.mover('2026-09-15T08:10:00-05:00')
  assert.equal(p.nucleo.procesarNotificaciones(c.correo).enviados, 1)
})

test('constancia al sellar y alerta de devolución vencida; nada para registros previos', () => {
  const p = preparar()
  const c = correoFalso()
  p.tabla.agregar('CFG_Destinatarios', [
    { correo: 'jefe@americana.edu.co', nombre: 'Jefe', evento: 'recepcion', activo: 'SI' },
    { correo: 'alertas@americana.edu.co', nombre: 'Alertas', evento: 'vencida', activo: 'SI' },
  ])
  const id = p.aprobada()
  p.mover('2026-09-15T09:45:00-05:00')
  ok(p.nucleo.ejecutar('recepcion.iniciar', { id, receptor: laura }))
  const elementos = ok(p.nucleo.ejecutar('catalogo.listar', {})).elementos
  const sello = ok(
    p.nucleo.ejecutar('recepcion.registrar', {
      asignacionId: id,
      receptor: laura,
      userAgent: 't',
      datos: {
        claveIdempotencia: randomUUID(),
        rol: 'DOCENTE',
        dependencia: 'Contaduría',
        cargo: '',
        celular: '3001234567',
        asistentesEstimados: 80,
        checklist: elementos.map((e) => ({
          elementoId: e.id,
          cantidadRecibida: e.cantidadEsperada,
          estado: 'CONFORME' as const,
          observacion: '',
          fotoIds: [],
        })),
        aceptaTerminos: true,
        autorizaDatos: true,
      },
    }),
  )
  p.nucleo.procesarNotificaciones(c.correo)
  const constancias = c.enviados.filter((m) => m.asunto.includes(sello.consecutivo))
  assert.equal(constancias.length, 2, 'receptor + destinatarios fijos')
  const fijos = constancias.find((m) => m.para.includes('jefe@americana.edu.co'))!
  assert.doesNotMatch(fijos.html, /3001234567|mi-solicitud/, 'sin celular ni enlace personal')
  // La constancia sigue íntegra aunque se escribió su bandeja.
  assert.equal(
    ok(p.nucleo.ejecutar('constancia.obtener', { consecutivo: sello.consecutivo }))?.integra,
    true,
  )

  // Vence el plazo de devolución (fin 12:00 + 24 h).
  p.mover('2026-09-16T12:00:01-05:00')
  p.nucleo.procesarNotificaciones(c.correo)
  const alerta = c.enviados.find((m) => /Devolución vencida/.test(m.asunto))
  assert.deepEqual(alerta?.para, ['alertas@americana.edu.co'])

  // Una constancia sellada antes de `notificaciones_desde` no se notifica.
  const q = preparar()
  const d = correoFalso()
  q.tabla.actualizar('CFG_General', 'clave', 'notificaciones_desde', {
    valor: '2099-01-01T00:00:00-05:00',
  })
  const id2 = q.aprobada()
  q.mover('2026-09-15T09:45:00-05:00')
  ok(q.nucleo.ejecutar('recepcion.iniciar', { id: id2, receptor: laura }))
  const s2 = ok(
    q.nucleo.ejecutar('recepcion.registrar', {
      asignacionId: id2,
      receptor: laura,
      userAgent: 't',
      datos: {
        claveIdempotencia: randomUUID(),
        rol: 'DOCENTE',
        dependencia: 'Contaduría',
        cargo: '',
        celular: '3001234567',
        asistentesEstimados: 80,
        checklist: elementos.map((e) => ({
          elementoId: e.id,
          cantidadRecibida: e.cantidadEsperada,
          estado: 'CONFORME' as const,
          observacion: '',
          fotoIds: [],
        })),
        aceptaTerminos: true,
        autorizaDatos: true,
      },
    }),
  )
  q.nucleo.procesarNotificaciones(d.correo)
  assert.ok(d.enviados.every((m) => !m.asunto.includes(s2.consecutivo)))
})
