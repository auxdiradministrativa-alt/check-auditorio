import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { crearNucleoMemoria } from '../src/infraestructura/memoria'

test('reintentar creación devuelve la misma entrega; cambiar su contenido se rechaza', () => {
  const { nucleo, tabla } = crearNucleoMemoria({
    ahora: () => new Date('2026-09-15T10:00:00-05:00'),
  })
  const datos = {
    id: randomUUID(),
    espacioId: 'esp-auditorio',
    evento: 'Grados',
    inicio: '2026-09-15T10:00:00-05:00',
    fin: '2026-09-15T12:00:00-05:00',
    correoReceptor: ' RECEPTOR@americana.edu.co ',
    entregadoPor: { nombre: 'Infraestructura', correo: 'auxdiradministrativa@americana.edu.co' },
    tokenSha256: createHash('sha256').update(randomUUID()).digest('hex'),
  }
  const primera = nucleo.ejecutar('asignacion.crear', datos)
  assert.equal(primera.ok, true)
  assert.deepEqual(nucleo.ejecutar('asignacion.crear', datos), primera)
  assert.equal(tabla.leer('Asignaciones').length, 1)
  assert.equal(nucleo.ejecutar('asignacion.crear', { ...datos, evento: 'Otro evento' }).ok, false)
  assert.equal(
    nucleo.ejecutar('asignacion.crear', { ...datos, correoReceptor: 'otro@americana.edu.co' }).ok,
    false,
  )
  assert.equal(
    nucleo.ejecutar('asignacion.crear', { ...datos, id: randomUUID(), inicio: 'fecha inválida' })
      .ok,
    false,
  )
})
