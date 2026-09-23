import type { ElementoCatalogo, RolReceptor } from '@check-auditorio/shared/sin-zod'

import type { Bitacora, Contexto, Servicios } from '../../aplicacion/puertos'
import type {
  EstadoNotificacion,
  Notificacion,
  NovedadDevolucion,
  RegistroAsignacion,
  RegistroDetalle,
  RegistroDevolucion,
  RegistroRecepcion,
} from '../../dominio/entidades'
import { isoBogota } from '@check-auditorio/shared/sin-zod'

import type { Fila, Tabla } from './esquema'
import { URL_APP_POR_DEFECTO } from './semilla'

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

/** Las filas anteriores a una columna nueva no traen esa clave: se leen como vacías. */
const t = (v: string | undefined) => v ?? ''
const nulo = (v: string | undefined) => (v ? v : null)

const aNotif = (
  estado: string | undefined,
  intentos: string | undefined,
  reserva: string | undefined,
): Notificacion => ({
  estado: t(estado) as EstadoNotificacion,
  intentos: entero(intentos),
  reservaHasta: t(reserva),
})

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
  invitadoCorreo: nulo(f.invitado_correo),
  solicitadaEn: nulo(f.solicitada_en),
  motivoRechazo: nulo(f.motivo_rechazo),
  solicitud: f.solicitud_rol
    ? {
        rol: f.solicitud_rol as RolReceptor,
        dependencia: t(f.solicitud_dependencia),
        cargo: t(f.solicitud_cargo),
        celular: t(f.solicitud_celular),
        asistentes: entero(f.solicitud_asistentes),
      }
    : null,
  autorizacion: f.autoriza_datos_en
    ? {
        en: f.autoriza_datos_en,
        version: t(f.autoriza_datos_version),
        sha256: t(f.autoriza_datos_sha256),
      }
    : null,
  notifDecision: aNotif(f.notif_decision, f.notif_decision_intentos, f.notif_decision_reserva),
  notifConfirmacion: aNotif(
    f.notif_confirmacion,
    f.notif_confirmacion_intentos,
    f.notif_confirmacion_reserva,
  ),
  notifVencida: aNotif(f.notif_vencida, f.notif_vencida_intentos, f.notif_vencida_reserva),
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
  invitado_correo: a.invitadoCorreo ?? '',
  solicitada_en: a.solicitadaEn ?? '',
  motivo_rechazo: a.motivoRechazo ?? '',
  solicitud_rol: a.solicitud?.rol ?? '',
  solicitud_dependencia: a.solicitud?.dependencia ?? '',
  solicitud_cargo: a.solicitud?.cargo ?? '',
  solicitud_celular: a.solicitud?.celular ?? '',
  solicitud_asistentes: a.solicitud ? String(a.solicitud.asistentes) : '',
  autoriza_datos_en: a.autorizacion?.en ?? '',
  autoriza_datos_version: a.autorizacion?.version ?? '',
  autoriza_datos_sha256: a.autorizacion?.sha256 ?? '',
  notif_decision: a.notifDecision.estado,
  notif_decision_intentos: String(a.notifDecision.intentos),
  notif_decision_reserva: a.notifDecision.reservaHasta,
  notif_confirmacion: a.notifConfirmacion.estado,
  notif_confirmacion_intentos: String(a.notifConfirmacion.intentos),
  notif_confirmacion_reserva: a.notifConfirmacion.reservaHasta,
  notif_vencida: a.notifVencida.estado,
  notif_vencida_intentos: String(a.notifVencida.intentos),
  notif_vencida_reserva: a.notifVencida.reservaHasta,
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
      // Se escriben solo las celdas que cambian: en Apps Script cada celda es una llamada.
      actualizar: (id, cambios) => {
        const actual = asignaciones().find((a) => a.id === id)
        if (!actual) return
        const antes = deAsignacion(actual)
        const despues = deAsignacion({ ...actual, ...cambios })
        const fila: Partial<Fila<'Asignaciones'>> = {}
        for (const k of Object.keys(despues) as (keyof Fila<'Asignaciones'>)[])
          if (despues[k] !== antes[k]) fila[k] = despues[k]
        if (Object.keys(fila).length) tabla.actualizar('Asignaciones', 'id', id, fila)
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
      notificaciones: () =>
        recepciones().map((f) => ({
          consecutivo: f.consecutivo,
          notif: aNotif(f.notificacion, f.notif_intentos, f.notif_reserva_hasta),
        })),
      marcarNotificacion: (consecutivo, n) =>
        tabla.actualizar('Recepciones', 'consecutivo', consecutivo, {
          notificacion: n.estado,
          notif_intentos: String(n.intentos),
          notif_reserva_hasta: n.reservaHasta,
        }),
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
      destinatarios: (evento) =>
        tabla
          .leer('CFG_Destinatarios')
          .filter((f) => activo(f.activo) && f.evento.trim().toLowerCase() === evento)
          .map((f) => f.correo.trim())
          .filter(Boolean),
      config: () => {
        const m = new Map(tabla.leer('CFG_General').map((f) => [f.clave.trim(), f.valor.trim()]))
        return {
          minutosQrAntes: entero(m.get('minutos_vigencia_qr_antes'), 30),
          horasDevolucion: entero(m.get('horas_plazo_devolucion'), 24),
          horasVigenciaInvitacion: entero(m.get('horas_vigencia_invitacion'), 72),
          urlApp: (m.get('url_app') || URL_APP_POR_DEFECTO).replace(/\/+$/, ''),
          notificacionesDesde: m.get('notificaciones_desde') ?? '',
        }
      },
    },
  }
}
