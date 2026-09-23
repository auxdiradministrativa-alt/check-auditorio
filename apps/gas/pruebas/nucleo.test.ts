import assert from 'node:assert/strict'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { test } from 'node:test'

import { cadenaAFirmar, type Entrada, type Respuesta } from '@check-auditorio/shared/sin-zod'

import { crearNucleoMemoria } from '../src/infraestructura/memoria'

const AHORA = new Date('2026-09-15T10:00:00-05:00')
const sha = (t: string) => createHash('sha256').update(t).digest('hex')
const infra = { nombre: 'Infraestructura', correo: 'auxdiradministrativa@americana.edu.co' }
const laura = { nombre: 'Laura Pérez', correo: 'laura.perez@americana.edu.co', sub: 'sub-laura' }

function ok<T>(r: Respuesta<T>): T {
  if (!r.ok) assert.fail(`${r.codigo}: ${r.mensaje}`)
  return r.datos
}

function preparar() {
  const { nucleo, tabla } = crearNucleoMemoria({ ahora: () => AHORA, secreto: 's3cr3t' })
  const programar = (evento: string, inicio: string, fin: string) => {
    const token = randomUUID()
    const a = ok(
      nucleo.ejecutar('asignacion.crear', {
        id: randomUUID(),
        espacioId: 'esp-auditorio',
        evento,
        inicio,
        fin,
        entregadoPor: infra,
        tokenSha256: sha(token),
      }),
    )
    return { a, tokenSha256: sha(token) }
  }
  const recibir = (asignacionId: string, tokenSha256: string, clave = randomUUID()) => {
    ok(nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: laura }))
    const catalogo = ok(nucleo.ejecutar('catalogo.listar', {}))
    const datos: Entrada<'recepcion.registrar'>['datos'] = {
      claveIdempotencia: clave,
      rol: 'DOCENTE',
      dependencia: 'Contaduría',
      cargo: '',
      celular: '3001234567',
      asistentesEstimados: 80,
      checklist: catalogo.elementos.map((e) => ({
        elementoId: e.id,
        estado: 'CONFORME' as const,
        observacion: '',
        fotoIds: [],
      })),
      aceptaTerminos: true,
      autorizaDatos: true,
    }
    return {
      datos,
      registrar: () =>
        nucleo.ejecutar('recepcion.registrar', {
          asignacionId,
          receptor: laura,
          datos,
          userAgent: 'test',
        }),
    }
  }
  return { nucleo, tabla, programar, recibir }
}

test('flujo completo: QR → validación → recepción sellada → constancia íntegra → devolución', () => {
  const { nucleo, programar, recibir } = preparar()
  const { a, tokenSha256 } = programar(
    'Foro',
    '2026-09-15T10:15:00-05:00',
    '2026-09-15T12:00:00-05:00',
  )

  assert.equal(ok(nucleo.ejecutar('qr.estado', { tokenSha256 }))?.vigencia, 'VIGENTE')
  const { registrar } = recibir(a.id, tokenSha256)
  const sello = ok(registrar())
  assert.equal(sello.consecutivo, 'REC-000001')
  assert.match(sello.sha256, /^[0-9a-f]{64}$/)

  const constancia = ok(nucleo.ejecutar('constancia.obtener', { consecutivo: sello.consecutivo }))
  assert.equal(constancia?.integra, true)
  assert.equal(constancia?.asignacion.estado, 'RECIBIDA')

  const devuelta = ok(
    nucleo.ejecutar('devolucion.registrar', {
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

test('idempotencia y consecutivos seguidos', () => {
  const { programar, recibir } = preparar()
  const uno = programar('Uno', '2026-09-15T10:00:00-05:00', '2026-09-15T10:30:00-05:00')
  const dos = programar('Dos', '2026-09-15T10:30:00-05:00', '2026-09-15T11:00:00-05:00')
  const r1 = recibir(uno.a.id, uno.tokenSha256)
  const s1 = ok(r1.registrar())
  assert.equal(ok(r1.registrar()).consecutivo, s1.consecutivo, 'misma clave → mismo consecutivo')
  const s2 = ok(recibir(dos.a.id, dos.tokenSha256).registrar())
  assert.deepEqual([s1.consecutivo, s2.consecutivo], ['REC-000001', 'REC-000002'])
})

test('editar a mano el detalle deja la constancia «Alterada»', () => {
  const { nucleo, tabla, programar, recibir } = preparar()
  const { a, tokenSha256 } = programar(
    'Foro',
    '2026-09-15T10:00:00-05:00',
    '2026-09-15T12:00:00-05:00',
  )
  const sello = ok(recibir(a.id, tokenSha256).registrar())
  tabla.actualizar('Recepcion_Detalle', 'elemento_id', 'as-sillas', { estado: 'NOVEDAD' })
  assert.equal(
    ok(nucleo.ejecutar('constancia.obtener', { consecutivo: sello.consecutivo }))?.integra,
    false,
  )
})

test('el catálogo sembrado es la lista oficial de infraestructura, en su orden', () => {
  const { nucleo } = preparar()
  assert.deepEqual(
    ok(nucleo.ejecutar('catalogo.listar', {})).elementos.map((e) => e.nombre),
    [
      'Estado general del auditorio',
      'Pisos',
      'Muros y pintura',
      'Puertas y accesos',
      'Iluminación',
      'Sistema de aire acondicionado',
      'Sillas y mobiliario',
      'Tomas e instalaciones eléctricas visibles',
      'Condiciones de aseo y organización',
      'Condiciones generales del espacio',
    ],
  )
})

test('novedad sin foto u observación se rechaza', () => {
  const { nucleo, programar, recibir } = preparar()
  const { a, tokenSha256 } = programar(
    'Foro',
    '2026-09-15T10:00:00-05:00',
    '2026-09-15T12:00:00-05:00',
  )
  const { datos } = recibir(a.id, tokenSha256)
  const enviar = () =>
    nucleo.ejecutar('recepcion.registrar', {
      asignacionId: a.id,
      receptor: laura,
      datos,
      userAgent: '',
    })

  datos.checklist[6] = {
    ...datos.checklist[6]!,
    estado: 'NOVEDAD',
    observacion: 'Hay tres sillas con el espaldar roto',
    fotoIds: [],
  }
  const r1 = enviar()
  assert.equal(r1.ok || r1.codigo, 'DATOS_INVALIDOS')

  datos.checklist[6] = { ...datos.checklist[6]!, observacion: '', fotoIds: ['foto-1'] }
  const r2 = enviar()
  assert.equal(r2.ok || r2.codigo, 'DATOS_INVALIDOS')
})

test('QR: otra cuenta no puede reclamarlo; la recepción es directa; sin franja previa al inicio', () => {
  const { nucleo, programar } = preparar()
  const { a, tokenSha256 } = programar(
    'Foro',
    '2026-09-15T10:00:00-05:00',
    '2026-09-15T12:00:00-05:00',
  )
  const otro = { ...laura, sub: 'sub-otro', correo: 'otro@americana.edu.co' }
  ok(nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: laura }))
  assert.equal(nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: otro }).ok, false)
  assert.equal(
    nucleo.ejecutar('validacion.decidir', { id: a.id, decision: 'RECHAZAR', actor: infra }).ok,
    false,
  )
  assert.equal(
    ok(nucleo.ejecutar('qr.reclamar', { tokenSha256, receptor: laura })).estado,
    'EN_DILIGENCIAMIENTO',
  )

  const futuro = programar('Tarde', '2026-09-15T18:00:00-05:00', '2026-09-15T20:00:00-05:00')
  // Horas antes del inicio ya se puede recibir: diligenciar sin ver el espacio es decisión de quien recibe.
  const r = nucleo.ejecutar('qr.reclamar', { tokenSha256: futuro.tokenSha256, receptor: laura })
  assert.equal(ok(r).estado, 'EN_DILIGENCIAMIENTO')
  assert.equal(
    ok(nucleo.ejecutar('qr.estado', { tokenSha256: futuro.tokenSha256 }))?.vigencia,
    'VIGENTE',
  )
})

test('cruce de horario en el mismo espacio se rechaza', () => {
  const { nucleo, programar } = preparar()
  programar('Evento A', '2026-09-15T10:00:00-05:00', '2026-09-15T12:00:00-05:00')
  const r = nucleo.ejecutar('asignacion.crear', {
    id: randomUUID(),
    espacioId: 'esp-auditorio',
    evento: 'Evento B',
    inicio: '2026-09-15T11:00:00-05:00',
    fin: '2026-09-15T13:00:00-05:00',
    entregadoPor: infra,
    tokenSha256: sha('x'),
  })
  assert.equal(r.ok || r.codigo, 'DATOS_INVALIDOS')
})

test('sobre HMAC: válido pasa; firma mala, fuera de ventana o nonce repetido se rechazan', () => {
  const { nucleo } = preparar()
  const firmar = (ts: number, nonce: string, secreto = 's3cr3t') => {
    const datos = '{}'
    const firma = createHmac('sha256', secreto)
      .update(cadenaAFirmar('catalogo.listar', ts, nonce, sha(datos)))
      .digest('hex')
    return JSON.stringify({ accion: 'catalogo.listar', datos, ts, nonce, firma })
  }
  const ts = AHORA.getTime() / 1000
  assert.equal(nucleo.atenderSobre(firmar(ts, 'n1')).ok, true)
  assert.equal(nucleo.atenderSobre(firmar(ts, 'n1')).ok, false, 'nonce repetido')
  assert.equal(nucleo.atenderSobre(firmar(ts, 'n2', 'otro')).ok, false, 'firma mala')
  assert.equal(nucleo.atenderSobre(firmar(ts - 400, 'n3')).ok, false, 'fuera de ventana')
})
