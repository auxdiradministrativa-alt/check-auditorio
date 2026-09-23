import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Entrada, Respuesta } from '@check-auditorio/shared/sin-zod'
import { crearNucleoMemoria } from '../src/infraestructura/memoria'
const infra = { nombre: 'Infraestructura', correo: 'auxdiradministrativa@americana.edu.co' }
const receptor = { nombre: 'Laura', correo: 'laura@americana.edu.co', sub: 'laura' }
const otro = { nombre: 'Otro', correo: 'otro@americana.edu.co', sub: 'otro' }
function ok<T>(r: Respuesta<T>): T {
  if (!r.ok) assert.fail(r.mensaje)
  return r.datos
}
function preparar() {
  let ahora = new Date('2026-09-15T10:00:00-05:00')
  const { nucleo, tabla } = crearNucleoMemoria({ ahora: () => ahora })
  const entrada = (): Entrada<'asignacion.crear'> => ({
    id: randomUUID(),
    espacioId: 'esp-auditorio',
    evento: 'Grados',
    inicio: '2026-09-15T10:00:00-05:00',
    fin: '2026-09-15T12:00:00-05:00',
    correoReceptor: receptor.correo,
    entregadoPor: infra,
    tokenSha256: createHash('sha256').update(randomUUID()).digest('hex'),
  })
  const a = ok(nucleo.ejecutar('asignacion.crear', entrada()))
  const datos = (): Entrada<'recepcion.registrar'>['datos'] => ({
    claveIdempotencia: randomUUID(),
    rol: 'DOCENTE',
    dependencia: 'Contaduría',
    cargo: '',
    celular: '3001234567',
    asistentesEstimados: 80,
    aceptaTerminos: true,
    autorizaDatos: true,
    checklist: ok(nucleo.ejecutar('catalogo.listar', {})).elementos.map((e) => ({
      elementoId: e.id,
      cantidadRecibida: e.cantidadEsperada,
      estado: 'CONFORME',
      observacion: '',
      fotoIds: [],
    })),
  })
  const iniciar = () => ok(nucleo.ejecutar('recepcion.iniciar', { id: a.id, receptor }))
  const firmar = (d = datos(), quien = receptor, id = a.id) =>
    nucleo.ejecutar('recepcion.registrar', {
      asignacionId: id,
      receptor: quien,
      datos: d,
      userAgent: 'test',
    })
  return {
    nucleo,
    tabla,
    a,
    entrada,
    datos,
    iniciar,
    firmar,
    mover: (iso: string) => {
      ahora = new Date(iso)
    },
  }
}
test('crear entrega → recepción directa → acta íntegra e idempotente', () => {
  const p = preparar()
  assert.equal(p.a.estado, 'PROGRAMADA')
  assert.equal(p.a.solicitud, null)
  assert.equal(p.a.invitadoCorreo, receptor.correo)
  assert.equal(p.iniciar().estado, 'EN_DILIGENCIAMIENTO')
  assert.equal(p.iniciar().receptor?.correo, receptor.correo)
  const datos = p.datos()
  const sello = ok(p.firmar(datos))
  assert.deepEqual(ok(p.firmar(datos)), sello)
  assert.equal(
    ok(p.nucleo.ejecutar('constancia.obtener', { consecutivo: sello.consecutivo }))?.integra,
    true,
  )
})
test('el enlace personal rechaza otra cuenta y la puerta de QR genérico', () => {
  const p = preparar()
  assert.equal(p.nucleo.ejecutar('recepcion.iniciar', { id: p.a.id, receptor: otro }).ok, false)
  const tokenSha256 = p.tabla.leer('Asignaciones')[0]!.token_sha256!
  assert.equal(p.nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: otro }).ok, false)
  p.iniciar()
  assert.equal(p.firmar(p.datos(), otro).ok, false)
})
test('el núcleo exige consentimientos, datos válidos y checklist completo', () => {
  const p = preparar()
  p.iniciar()
  for (const cambio of [
    { aceptaTerminos: false },
    { autorizaDatos: false },
    { celular: '123' },
    { asistentesEstimados: -1 },
    { dependencia: '' },
    { rol: 'INVENTADO' },
    { checklist: [] },
  ]) {
    assert.equal(
      p.firmar({ ...p.datos(), ...cambio } as Entrada<'recepcion.registrar'>['datos']).ok,
      false,
    )
  }
  const datos = p.datos()
  datos.checklist[0]!.estado = 'INVENTADO' as 'CONFORME'
  assert.equal(p.firmar(datos).ok, false)
})
test('un reintento no revela actas ajenas ni reutiliza la clave para otra entrega', () => {
  const p = preparar()
  p.iniciar()
  const datos = p.datos()
  ok(p.firmar(datos))
  assert.equal(p.firmar(datos, otro).ok, false)
  const segunda = ok(
    p.nucleo.ejecutar('asignacion.crear', {
      ...p.entrada(),
      inicio: '2026-09-15T12:00:00-05:00',
      fin: '2026-09-15T13:00:00-05:00',
    }),
  )
  p.mover('2026-09-15T12:00:00-05:00')
  ok(p.nucleo.ejecutar('recepcion.iniciar', { id: segunda.id, receptor }))
  assert.equal(p.firmar(datos, receptor, segunda.id).ok, false)
})
test('las fotos del acta deben pertenecer a la entrega', () => {
  const p = preparar()
  p.iniciar()
  const datos = p.datos()
  datos.checklist[0] = {
    ...datos.checklist[0]!,
    estado: 'NOVEDAD',
    observacion: 'Elemento con daño visible',
    fotoIds: ['foto-ajena'],
  }
  assert.equal(p.firmar(datos).ok, false)
  const foto = ok(
    p.nucleo.ejecutar('foto.subir', {
      asignacionId: p.a.id,
      actor: receptor,
      mime: 'image/jpeg',
      base64: '/9j/AA==',
    }),
  )
  datos.checklist[0]!.fotoIds = [foto.id]
  ok(p.firmar(datos))
})
test('antes del horario, después del fin y tras anular no se inicia', () => {
  const p = preparar()
  p.mover('2026-09-15T08:00:00-05:00')
  assert.equal(p.nucleo.ejecutar('recepcion.iniciar', { id: p.a.id, receptor }).ok, false)
  p.mover('2026-09-15T13:00:00-05:00')
  assert.equal(p.nucleo.ejecutar('recepcion.iniciar', { id: p.a.id, receptor }).ok, false)
  p.mover('2026-09-15T10:00:00-05:00')
  ok(p.nucleo.ejecutar('asignacion.anular', { id: p.a.id, actor: infra }))
  assert.equal(p.nucleo.ejecutar('recepcion.iniciar', { id: p.a.id, receptor }).ok, false)
})
test('crear valida correo institucional, horario y evita entregas duplicadas por cruce', () => {
  const p = preparar()
  assert.equal(
    p.nucleo.ejecutar('asignacion.crear', { ...p.entrada(), correoReceptor: 'x@gmail.com' }).ok,
    false,
  )
  assert.equal(p.nucleo.ejecutar('asignacion.crear', p.entrada()).ok, false)
  assert.equal(
    p.nucleo.ejecutar('asignacion.crear', {
      ...p.entrada(),
      inicio: '2026-09-14T08:00:00-05:00',
      fin: '2026-09-14T09:00:00-05:00',
    }).ok,
    false,
  )
})

test('una recepción abierta no permite reentrar ni firmar después del fin', () => {
  const p = preparar()
  p.iniciar()
  p.mover('2026-09-15T12:00:01-05:00')
  const inicio = p.nucleo.ejecutar('recepcion.iniciar', { id: p.a.id, receptor })
  assert.equal(inicio.ok || inicio.codigo, 'QR_NO_VIGENTE')
  const firma = p.firmar()
  assert.equal(firma.ok || firma.codigo, 'QR_NO_VIGENTE')
})

test('devolver exige declaración, cuenta autorizada y clave propia; el reintento es seguro', () => {
  const p = preparar()
  p.iniciar()
  ok(p.firmar())
  const datos: Entrada<'devolucion.registrar'>['datos'] = {
    claveIdempotencia: randomUUID(),
    resultado: 'BUENAS_CONDICIONES',
    novedades: [],
    declaracion: true,
  }
  const devolver = (cambio = {}, quien = receptor, id = p.a.id) =>
    p.nucleo.ejecutar('devolucion.registrar', {
      asignacionId: id,
      receptor: quien,
      datos: { ...datos, ...cambio },
    })
  const sinDeclarar = devolver({ declaracion: false })
  assert.equal(sinDeclarar.ok || sinDeclarar.codigo, 'DATOS_INVALIDOS')
  const ajeno = devolver({}, otro)
  assert.equal(ajeno.ok || ajeno.codigo, 'NO_AUTORIZADO')
  const devuelta = ok(devolver())
  assert.equal(devuelta.estado, 'DEVUELTA')
  assert.deepEqual(ok(devolver()), devuelta)
  const segunda = ok(
    p.nucleo.ejecutar('asignacion.crear', {
      ...p.entrada(),
      inicio: '2026-09-15T12:00:00-05:00',
      fin: '2026-09-15T13:00:00-05:00',
    }),
  )
  p.mover('2026-09-15T12:00:00-05:00')
  ok(p.nucleo.ejecutar('recepcion.iniciar', { id: segunda.id, receptor }))
  ok(p.firmar(p.datos(), receptor, segunda.id))
  const reutilizada = devolver({}, receptor, segunda.id)
  assert.equal(reutilizada.ok || reutilizada.codigo, 'DATOS_INVALIDOS')
})

test('devolución con novedades rechaza fotos ajenas, duplicadas y datos malformados', () => {
  const p = preparar()
  p.iniciar()
  ok(p.firmar())
  const foto = ok(
    p.nucleo.ejecutar('foto.subir', {
      asignacionId: p.a.id,
      actor: receptor,
      mime: 'image/jpeg',
      base64: '/9j/AA==',
    }),
  )
  const elementoId = p.datos().checklist[0]!.elementoId
  const novedad = { elementoId, observacion: 'Daño visible', fotoIds: [foto.id] }
  const devolver = (novedades: unknown) =>
    p.nucleo.ejecutar('devolucion.registrar', {
      asignacionId: p.a.id,
      receptor,
      datos: {
        claveIdempotencia: randomUUID(),
        resultado: 'CON_NOVEDADES',
        declaracion: true,
        novedades: novedades as Entrada<'devolucion.registrar'>['datos']['novedades'],
      },
    })
  for (const novedades of [
    [{ ...novedad, fotoIds: ['ajena'] }],
    [{ ...novedad, fotoIds: [foto.id, foto.id] }],
    [novedad, novedad],
    [null],
    [{ ...novedad, observacion: 42 }],
  ]) {
    const r = devolver(novedades)
    assert.equal(r.ok || r.codigo, 'DATOS_INVALIDOS')
  }
  assert.equal(ok(devolver([novedad])).estado, 'DEVUELTA')
})

test('QR reclamado no se reabre fuera de vigencia', () => {
  const p = preparar()
  const entrada = p.entrada()
  const a = ok(
    p.nucleo.ejecutar('asignacion.crear', {
      ...entrada,
      correoReceptor: undefined,
      inicio: '2026-09-15T12:00:00-05:00',
      fin: '2026-09-15T13:00:00-05:00',
    }),
  )
  p.mover('2026-09-15T12:00:00-05:00')
  assert.equal(
    ok(p.nucleo.ejecutar('qr.reclamar', { tokenSha256: entrada.tokenSha256, receptor })).id,
    a.id,
  )
  p.mover('2026-09-15T13:00:01-05:00')
  const resultado = p.nucleo.ejecutar('qr.reclamar', { tokenSha256: entrada.tokenSha256, receptor })
  assert.equal(resultado.ok || resultado.codigo, 'QR_NO_VIGENTE')
})
