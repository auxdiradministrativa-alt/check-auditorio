import {
  DOMINIO_INSTITUCIONAL,
  ROLES_RECEPTOR,
  isoBogota,
  type Entrada,
  type Salida,
} from '@check-auditorio/shared/sin-zod'

import {
  estadoEfectivo,
  exigirInvitado,
  exigirReceptor,
  exigirSinCruce,
  vigenciaQr,
} from '../../dominio/asignacion'
import { SIN_NOTIFICACION, type RegistroAsignacion } from '../../dominio/entidades'
import { fallar } from '../../dominio/errores'
import type { Contexto } from '../puertos'
import { exigirAsignacion, marcaDeTiempo, releer, vista } from './comun'

/*
 * Flujo por enlace personal (spec 2026-09-23):
 *   INVITADA ─diligenciar→ SOLICITADA ─aprobar→ PROGRAMADA ─iniciar→ EN_DILIGENCIAMIENTO → (recepción)
 *                               └─rechazar→ RECHAZADA ─diligenciar→ SOLICITADA
 * La identidad sale siempre de la sesión y se compara con `invitado_correo`; el espacio, la hora
 * y el texto autorizado los fija el núcleo.
 */

const HORA_MS = 3_600_000
/** Cada decisión reabre su aviso: una corrección aprobada después también se notifica. */
const PENDIENTE = { estado: 'PENDIENTE', intentos: 0, reservaHasta: '' } as const
const ms = (iso: string) => new Date(iso).getTime()
const ISO_BOGOTA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

/** Un solo espacio en v1: se elige solo, pero nunca en silencio si alguien activa otro. */
function espacioUnico(ctx: Contexto) {
  const espacios = ctx.catalogo.espacios()
  if (espacios.length !== 1)
    fallar(
      'INTERNO',
      `El flujo por enlace necesita exactamente un espacio activo en CAT_Espacios (hay ${espacios.length}).`,
    )
  return espacios[0]!
}

export function crearInvitacion(
  ctx: Contexto,
  e: Entrada<'invitacion.crear'>,
): Salida<'invitacion.crear'> {
  return ctx.srv.conBloqueo(() => {
    const correo = e.correoSolicitante.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+$/.test(correo) || !correo.endsWith(`@${DOMINIO_INSTITUCIONAL}`))
      fallar('DATOS_INVALIDOS', `El correo debe ser @${DOMINIO_INSTITUCIONAL}.`)
    if (!/^[0-9a-f-]{36}$/i.test(e.id) || ctx.asignaciones.porId(e.id))
      fallar('DATOS_INVALIDOS', 'Identificador de asignación inválido o repetido.')
    if (!/^[0-9a-f]{64}$/.test(e.tokenSha256)) fallar('DATOS_INVALIDOS', 'Huella del QR inválida.')
    const espacio = espacioUnico(ctx)
    const ahora = ctx.srv.ahora()
    const creadaEn = isoBogota(ahora)
    const registro: RegistroAsignacion = {
      id: e.id,
      espacioId: espacio.id,
      evento: e.referencia.trim() || 'Por definir',
      // Sin franja todavía: la propone quien solicita. Una franja vacía no ocupa el espacio.
      inicio: creadaEn,
      fin: creadaEn,
      estado: 'INVITADA',
      entregadoPorCorreo: e.entregadoPor.correo,
      creadaEn,
      tokenSha256: e.tokenSha256,
      tokenVence: isoBogota(
        new Date(ahora.getTime() + ctx.catalogo.config().horasVigenciaInvitacion * HORA_MS),
      ),
      receptor: null,
      consecutivo: null,
      invitadoCorreo: correo,
      solicitadaEn: null,
      motivoRechazo: null,
      solicitud: null,
      autorizacion: null,
      notifDecision: SIN_NOTIFICACION,
      notifConfirmacion: SIN_NOTIFICACION,
      notifVencida: SIN_NOTIFICACION,
    }
    ctx.asignaciones.agregar(registro)
    ctx.bitacora.registrar('invitacion.crear', e.id, e.entregadoPor.correo, { para: correo })
    return releer(ctx, e.id)
  })
}

export function diligenciarSolicitud(
  ctx: Contexto,
  { id, receptor, datos }: Entrada<'solicitud.diligenciar'>,
): Salida<'solicitud.diligenciar'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, id)
    exigirInvitado(a, receptor.correo)
    if (a.receptor && a.receptor.sub !== receptor.sub)
      fallar('NO_AUTORIZADO', 'Esta solicitud está a nombre de otra cuenta.')
    const ahora = ctx.srv.ahora()
    const cfg = ctx.catalogo.config()
    const estado = estadoEfectivo(a, ahora, cfg)
    if (estado === 'EXPIRADA')
      fallar('ESTADO_INVALIDO', 'Este enlace venció. Pide uno nuevo a Infraestructura.')
    if (estado !== 'INVITADA' && estado !== 'RECHAZADA')
      fallar('ESTADO_INVALIDO', 'Esta solicitud ya fue enviada y no se puede modificar.')

    // El servidor revalida lo que decide la regla de negocio; la forma ya la validó zod en la web.
    if (datos.autorizaDatos !== true)
      fallar('DATOS_INVALIDOS', 'Debes autorizar el tratamiento de datos.')
    if (!ISO_BOGOTA.test(datos.inicio) || !ISO_BOGOTA.test(datos.fin))
      fallar('DATOS_INVALIDOS', 'Fecha u hora inválida.')
    if (!ROLES_RECEPTOR.includes(datos.rol)) fallar('DATOS_INVALIDOS', 'Rol inválido.')
    if (!/^3\d{9}$/.test(datos.celular.trim()))
      fallar('DATOS_INVALIDOS', 'Celular colombiano de 10 dígitos.')
    if (!(datos.asistentesEstimados > 0))
      fallar('DATOS_INVALIDOS', 'Indica cuántas personas asistirán.')
    if (datos.evento.trim().length < 3) fallar('DATOS_INVALIDOS', 'Escribe el nombre del evento.')
    const inicio = isoBogota(new Date(datos.inicio))
    const fin = isoBogota(new Date(datos.fin))
    if (ms(inicio) <= ahora.getTime())
      fallar('DATOS_INVALIDOS', 'El evento debe empezar en el futuro.')
    exigirSinCruce(ctx.asignaciones.listar(), { espacioId: a.espacioId, inicio, fin }, ahora, cfg)

    const terminos =
      ctx.catalogo.terminosVigentes() ?? fallar('INTERNO', 'No hay términos vigentes.')
    const solicitadaEn = isoBogota(ahora)
    ctx.asignaciones.actualizar(id, {
      estado: 'SOLICITADA',
      evento: datos.evento.trim(),
      inicio,
      fin,
      // Sin aprobar, la solicitud vive hasta el inicio que propuso: la lentitud del gestor no la
      // vence, pero una fecha que pasa sin aprobación sí.
      tokenVence: inicio,
      receptor: { nombre: receptor.nombre, correo: receptor.correo, sub: receptor.sub },
      solicitadaEn,
      solicitud: {
        rol: datos.rol,
        dependencia: datos.dependencia.trim(),
        cargo: (datos.cargo ?? '').trim(),
        celular: datos.celular.trim(),
        asistentes: datos.asistentesEstimados,
      },
      autorizacion: { en: solicitadaEn, version: terminos.version, sha256: terminos.sha256 },
    })
    ctx.bitacora.registrar('solicitud.diligenciar', id, receptor.correo, {
      inicio,
      fin,
      terminos: terminos.version,
    })
    return releer(ctx, id)
  })
}

export function decidirSolicitud(
  ctx: Contexto,
  { id, decision, motivo, version, actor }: Entrada<'solicitud.decidir'>,
): Salida<'solicitud.decidir'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, id)
    const ahora = ctx.srv.ahora()
    const cfg = ctx.catalogo.config()
    const estado = estadoEfectivo(a, ahora, cfg)
    if (estado === 'EXPIRADA')
      fallar('ESTADO_INVALIDO', 'La fecha propuesta ya pasó sin aprobación.')
    if (estado !== 'SOLICITADA')
      fallar('ESTADO_INVALIDO', 'Esta solicitud ya no está esperando aprobación.')
    // Aprobar exactamente lo que se vio: si cambió entre abrir y decidir, se vuelve a revisar.
    if (a.solicitadaEn !== version)
      fallar('ESTADO_INVALIDO', 'La solicitud cambió mientras la revisabas. Vuelve a revisarla.')

    if (decision === 'APROBAR') {
      if (ms(a.fin) <= ahora.getTime()) fallar('ESTADO_INVALIDO', 'El evento ya terminó.')
      exigirSinCruce(
        ctx.asignaciones.listar(),
        { espacioId: a.espacioId, inicio: a.inicio, fin: a.fin },
        ahora,
        cfg,
      )
      ctx.asignaciones.actualizar(id, {
        estado: 'PROGRAMADA',
        tokenVence: a.fin,
        motivoRechazo: null,
        notifDecision: PENDIENTE,
        notifConfirmacion: PENDIENTE,
      })
    } else {
      const texto = (motivo ?? '').trim()
      if (texto.length < 5) fallar('DATOS_INVALIDOS', 'Explica qué debe corregir.')
      ctx.asignaciones.actualizar(id, {
        estado: 'RECHAZADA',
        motivoRechazo: texto.slice(0, 300),
        notifDecision: PENDIENTE,
      })
    }
    ctx.bitacora.registrar(`solicitud.${decision.toLowerCase()}`, id, actor.correo, {
      version,
      ...(decision === 'RECHAZAR' ? { motivo } : {}),
    })
    return releer(ctx, id)
  })
}

/** Quien solicitó abre el checklist dentro de la vigencia. Volver a entrar es idempotente. */
export function iniciarRecepcion(
  ctx: Contexto,
  { id, receptor }: Entrada<'recepcion.iniciar'>,
): Salida<'recepcion.iniciar'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, id)
    exigirInvitado(a, receptor.correo)
    exigirReceptor(a, receptor.sub)
    if (a.estado === 'EN_DILIGENCIAMIENTO') return vista(ctx, a)
    const cfg = ctx.catalogo.config()
    const ahora = ctx.srv.ahora()
    if (estadoEfectivo(a, ahora, cfg) !== 'PROGRAMADA')
      fallar('ESTADO_INVALIDO', 'Esta solicitud no está lista para recibir el espacio.')
    if (vigenciaQr(a, ahora, cfg) !== 'VIGENTE')
      fallar(
        'QR_NO_VIGENTE',
        `Podrás confirmar la recepción desde ${cfg.minutosQrAntes} minutos antes del inicio.`,
      )
    ctx.asignaciones.actualizar(id, { estado: 'EN_DILIGENCIAMIENTO' })
    ctx.bitacora.registrar('recepcion.iniciar', id, receptor.correo)
    return releer(ctx, id)
  })
}
