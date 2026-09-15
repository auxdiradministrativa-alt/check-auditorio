import type { ElementoCatalogo } from '@check-auditorio/shared/sin-zod'

import type { Bitacora, Contexto, Servicios } from '../../aplicacion/puertos'
import type {
  NovedadDevolucion,
  RegistroAsignacion,
  RegistroDetalle,
  RegistroDevolucion,
  RegistroRecepcion,
} from '../../dominio/entidades'
import { isoBogota } from '@check-auditorio/shared/sin-zod'

import type { Fila, Tabla } from './esquema'

/*
 * Repositorios sobre cualquier `Tabla`: aquí, y solo aquí, se traduce columna ⇄ entidad.
 * Todo se guarda como texto; los números se reconstruyen al leer.
 */

const entero = (v: string | undefined, porDefecto = 0) => {
  const n = Number.parseInt((v ?? '').trim(), 10)
  return Number.isFinite(n) ? n : porDefecto
}
const activo = (v: string) =>
  ['si', 'sí', 'true', 'verdadero', '1', 'x'].includes(v.trim().toLowerCase())
const lista = (v: string) => (v ? v.split(',').filter(Boolean) : [])

/* ─── Asignaciones ─── */

const aAsignacion = (f: Fila<'Asignaciones'>): RegistroAsignacion => ({
  id: f.id,
  espacioId: f.espacio_id,
  evento: f.evento,
  inicio: f.inicio,
  fin: f.fin,
  estado: f.estado as RegistroAsignacion['estado'],
  entregadoPorCorreo: f.entregado_por,
  creadaEn: f.creada_en,
  tokenSha256: f.token_sha256,
  tokenVence: f.token_vence,
  receptor: f.receptor_sub
    ? { correo: f.receptor_correo, nombre: f.receptor_nombre, sub: f.receptor_sub }
    : null,
  consecutivo: f.consecutivo || null,
})

const deAsignacion = (a: RegistroAsignacion): Fila<'Asignaciones'> => ({
  id: a.id,
  espacio_id: a.espacioId,
  evento: a.evento,
  inicio: a.inicio,
  fin: a.fin,
  estado: a.estado,
  entregado_por: a.entregadoPorCorreo,
  creada_en: a.creadaEn,
  token_sha256: a.tokenSha256,
  token_vence: a.tokenVence,
  receptor_correo: a.receptor?.correo ?? '',
  receptor_nombre: a.receptor?.nombre ?? '',
  receptor_sub: a.receptor?.sub ?? '',
  consecutivo: a.consecutivo ?? '',
})

/* ─── Recepciones ─── */

const NOTIFICACION_INICIAL = {
  notificacion: 'PENDIENTE',
  notif_intentos: '0',
  notif_reserva_hasta: '',
}

const aRecepcion = (f: Fila<'Recepciones'>): RegistroRecepcion => ({
  consecutivo: f.consecutivo,
  asignacionId: f.asignacion_id,
  receptor: { nombre: f.receptor_nombre, correo: f.receptor_correo, sub: f.receptor_sub },
  rol: f.rol as RegistroRecepcion['rol'],
  dependencia: f.dependencia,
  cargo: f.cargo,
  celular: f.celular,
  asistentes: entero(f.asistentes),
  terminosVersion: f.terminos_version,
  terminosSha256: f.terminos_sha256,
  selladaEn: f.sellada_en,
  sha256: f.sha256,
  codigoVerificacion: f.codigo_verificacion,
  claveIdempotencia: f.clave_idempotencia,
  userAgent: f.user_agent,
})

const deRecepcion = (r: RegistroRecepcion): Fila<'Recepciones'> => ({
  consecutivo: r.consecutivo,
  asignacion_id: r.asignacionId,
  receptor_nombre: r.receptor.nombre,
  receptor_correo: r.receptor.correo,
  receptor_sub: r.receptor.sub,
  rol: r.rol,
  dependencia: r.dependencia,
  cargo: r.cargo,
  celular: r.celular,
  asistentes: String(r.asistentes),
  terminos_version: r.terminosVersion,
  terminos_sha256: r.terminosSha256,
  sellada_en: r.selladaEn,
  sha256: r.sha256,
  codigo_verificacion: r.codigoVerificacion,
  clave_idempotencia: r.claveIdempotencia,
  user_agent: r.userAgent,
  ...NOTIFICACION_INICIAL,
})

const aDetalle = (f: Fila<'Recepcion_Detalle'>): RegistroDetalle => ({
  elementoId: f.elemento_id,
  elementoNombre: f.elemento_nombre,
  categoria: f.categoria as RegistroDetalle['categoria'],
  cantidadEsperada: entero(f.cantidad_esperada),
  cantidadRecibida: entero(f.cantidad_recibida),
  estado: f.estado as RegistroDetalle['estado'],
  observacion: f.observacion,
  fotoIds: lista(f.foto_ids),
})

const deDetalle = (consecutivo: string, d: RegistroDetalle): Fila<'Recepcion_Detalle'> => ({
  consecutivo,
  elemento_id: d.elementoId,
  elemento_nombre: d.elementoNombre,
  categoria: d.categoria,
  cantidad_esperada: String(d.cantidadEsperada),
  cantidad_recibida: String(d.cantidadRecibida),
  estado: d.estado,
  observacion: d.observacion,
  foto_ids: d.fotoIds.join(','),
})

/* ─── Devoluciones ─── */

const aDevolucion = (f: Fila<'Devoluciones'>): RegistroDevolucion => ({
  consecutivo: f.consecutivo,
  resultado: f.resultado as RegistroDevolucion['resultado'],
  declaradaEn: f.declarada_en,
  sha256: f.sha256,
  claveIdempotencia: f.clave_idempotencia,
})

/* ─── Composición ─── */

export function crearContexto(tabla: Tabla, srv: Servicios): Contexto {
  const asignaciones = () => tabla.leer('Asignaciones').map(aAsignacion)
  const recepciones = () => tabla.leer('Recepciones')
  const devoluciones = () => tabla.leer('Devoluciones')

  const bitacora: Bitacora = {
    registrar: (evento, entidadId, actorCorreo, datos = {}) =>
      tabla.agregar('Bitacora', [
        {
          ts: isoBogota(srv.ahora()),
          evento,
          entidad_id: entidadId,
          actor_correo: actorCorreo,
          datos_json: JSON.stringify(datos),
        },
      ]),
  }

  return {
    srv,
    bitacora,
    asignaciones: {
      listar: asignaciones,
      porId: (id) => asignaciones().find((a) => a.id === id) ?? null,
      porToken: (sha) => asignaciones().find((a) => a.tokenSha256 === sha) ?? null,
      agregar: (a) => tabla.agregar('Asignaciones', [deAsignacion(a)]),
      actualizar: (id, cambios) => {
        const fila: Partial<Fila<'Asignaciones'>> = {}
        if (cambios.estado) fila.estado = cambios.estado
        if (cambios.consecutivo !== undefined) fila.consecutivo = cambios.consecutivo ?? ''
        if (cambios.receptor !== undefined) {
          fila.receptor_correo = cambios.receptor?.correo ?? ''
          fila.receptor_nombre = cambios.receptor?.nombre ?? ''
          fila.receptor_sub = cambios.receptor?.sub ?? ''
        }
        tabla.actualizar('Asignaciones', 'id', id, fila)
      },
    },
    recepciones: {
      porConsecutivo: (c) => {
        const f = recepciones().find((r) => r.consecutivo === c)
        return f ? aRecepcion(f) : null
      },
      porClave: (k) => {
        const f = recepciones().find((r) => r.clave_idempotencia === k)
        return f ? aRecepcion(f) : null
      },
      consecutivos: () => recepciones().map((r) => r.consecutivo),
      detalle: (c) =>
        tabla
          .leer('Recepcion_Detalle')
          .filter((d) => d.consecutivo === c)
          .map(aDetalle),
      agregar: (r, detalle) => {
        tabla.agregar(
          'Recepcion_Detalle',
          detalle.map((d) => deDetalle(r.consecutivo, d)),
        )
        tabla.agregar('Recepciones', [deRecepcion(r)])
      },
    },
    devoluciones: {
      porConsecutivo: (c) => {
        const f = devoluciones().find((d) => d.consecutivo === c)
        return f ? aDevolucion(f) : null
      },
      porClave: (k) => {
        const f = devoluciones().find((d) => d.clave_idempotencia === k)
        return f ? aDevolucion(f) : null
      },
      agregar: (d: RegistroDevolucion, novedades: NovedadDevolucion[]) => {
        if (novedades.length)
          tabla.agregar(
            'Devolucion_Detalle',
            novedades.map((n) => ({
              consecutivo: d.consecutivo,
              elemento_id: n.elementoId,
              observacion: n.observacion,
              foto_ids: n.fotoIds.join(','),
            })),
          )
        tabla.agregar('Devoluciones', [
          {
            consecutivo: d.consecutivo,
            resultado: d.resultado,
            declarada_en: d.declaradaEn,
            sha256: d.sha256,
            clave_idempotencia: d.claveIdempotencia,
            ...NOTIFICACION_INICIAL,
          },
        ])
      },
    },
    catalogo: {
      espacios: () =>
        tabla
          .leer('CAT_Espacios')
          .filter((f) => activo(f.activo))
          .map((f) => ({
            id: f.id,
            nombre: f.nombre,
            ubicacion: f.ubicacion,
            capacidad: entero(f.capacidad),
          })),
      elementos: (espacioId) =>
        tabla
          .leer('CAT_Elementos')
          .filter((f) => activo(f.activo) && f.espacio_id === espacioId)
          .map((f): ElementoCatalogo => ({
            id: f.id,
            espacioId: f.espacio_id,
            nombre: f.nombre,
            categoria: f.categoria.trim().toUpperCase() as ElementoCatalogo['categoria'],
            cantidadEsperada: entero(f.cantidad_esperada),
            orden: entero(f.orden),
          }))
          .sort((a, b) => a.orden - b.orden),
      terminosVigentes: () => {
        const f = tabla
          .leer('CFG_Terminos')
          .filter((t) => activo(t.vigente))
          .slice(-1)[0]
        return f
          ? {
              version: f.version,
              clausulas: JSON.parse(f.texto_clausulas) as string[],
              tratamientoDatos: f.texto_datos,
              sha256: f.sha256,
            }
          : null
      },
      entregadores: () =>
        tabla.leer('CFG_Entregadores').map((f) => ({
          correo: f.correo.trim(),
          nombre: f.nombre.trim(),
          activo: activo(f.activo),
        })),
      config: () => {
        const m = new Map(tabla.leer('CFG_General').map((f) => [f.clave.trim(), f.valor.trim()]))
        return {
          minutosQrAntes: entero(m.get('minutos_vigencia_qr_antes'), 30),
          horasDevolucion: entero(m.get('horas_plazo_devolucion'), 24),
        }
      },
    },
  }
}
