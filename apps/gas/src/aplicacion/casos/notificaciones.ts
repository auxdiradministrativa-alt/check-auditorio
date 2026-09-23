import { isoBogota } from '@check-auditorio/shared/sin-zod'

import { estadoEfectivo } from '../../dominio/asignacion'
import type { Notificacion, RegistroAsignacion } from '../../dominio/entidades'
import {
  correoConfirmacion,
  correoConstanciaDestinatarios,
  correoConstanciaReceptor,
  correoDecision,
  correoVencida,
  type DatosEvento,
} from '../correo/plantillas'
import type { Contexto, Correo, Mensaje } from '../puertos'

/*
 * Bandeja de salida (outbox). La recorre un activador de tiempo de Apps Script cada 10 min.
 * El correo nunca es el registro: todo lo que avisa ya está guardado y visible en la web.
 *
 *   1. Con bloqueo: se eligen los pendientes y se reservan (ENVIANDO + reserva_hasta).
 *   2. SIN bloqueo: se envía. MailApp tarda segundos y el bloqueo lo esperan las firmas de los
 *      usuarios (`waitLock` de 20 s): enviar dentro lo haría fallar.
 *   3. Con bloqueo corto: se marca ENVIADO, o se suma un intento (al 3.º, FALLIDO + bitácora).
 *
 * La reserva dura más que la ejecución máxima de Apps Script (6 min): mientras un turno envía,
 * ningún otro puede tomar la misma fila. Si el turno muere, la reserva vence y otro la retoma.
 * Hueco aceptado: morir entre enviar y marcar reenvía ese correo una vez.
 */

const RESERVA_MS = 10 * 60_000
const INTENTOS_MAX = 3
const HORA_MS = 3_600_000

type Canal =
  | { hoja: 'asignacion'; id: string; campo: 'notifDecision' | 'notifConfirmacion' | 'notifVencida' }
  | { hoja: 'recepcion'; consecutivo: string }

interface Trabajo {
  canal: Canal
  notif: Notificacion
  mensajes: Mensaje[]
}

export interface ResumenNotificaciones {
  enviados: number
  fallidos: number
  reintentar: number
  omitidos: number
}

const disponible = (n: Notificacion, ahoraIso: string) =>
  n.estado === 'PENDIENTE' || (n.estado === 'ENVIANDO' && n.reservaHasta < ahoraIso)

const destinatariosDe = (canal: Canal) =>
  canal.hoja === 'asignacion' ? `${canal.id}:${canal.campo}` : canal.consecutivo

export function procesarNotificaciones(ctx: Contexto, correo: Correo): ResumenNotificaciones {
  const resumen: ResumenNotificaciones = { enviados: 0, fallidos: 0, reintentar: 0, omitidos: 0 }

  /* ─── 1. Elegir y reservar ─── */
  const trabajos = ctx.srv.conBloqueo(() => {
    const ahora = ctx.srv.ahora()
    const ahoraIso = isoBogota(ahora)
    const reserva = isoBogota(new Date(ahora.getTime() + RESERVA_MS))
    const cfg = ctx.catalogo.config()
    const espacios = ctx.catalogo.espacios()
    const elegidos: Trabajo[] = []

    const evento = (a: RegistroAsignacion): DatosEvento => ({
      id: a.id,
      evento: a.evento,
      espacio: espacios.find((e) => e.id === a.espacioId)?.nombre ?? a.espacioId,
      inicio: a.inicio,
      fin: a.fin,
      urlApp: cfg.urlApp,
    })
    const nombre = (a: RegistroAsignacion) => a.receptor?.nombre || a.invitadoCorreo || ''

    const omitir = (canal: Canal, n: Notificacion) => {
      marcar(ctx, canal, { ...n, estado: 'OMITIDO', reservaHasta: '' })
      resumen.omitidos++
    }
    const tomar = (canal: Canal, n: Notificacion, mensajes: Mensaje[]) => {
      const reservada: Notificacion = { ...n, estado: 'ENVIANDO', reservaHasta: reserva }
      marcar(ctx, canal, reservada)
      elegidos.push({ canal, notif: reservada, mensajes })
    }

    for (const a of ctx.asignaciones.listar()) {
      const estado = estadoEfectivo(a, ahora, cfg)

      if (disponible(a.notifDecision, ahoraIso)) {
        const canal: Canal = { hoja: 'asignacion', id: a.id, campo: 'notifDecision' }
        // Se avisa la decisión vigente; si ya no lo es (corrigió, anulada, vencida), sobra.
        if ((a.estado === 'PROGRAMADA' || a.estado === 'RECHAZADA') && a.invitadoCorreo)
          tomar(canal, a.notifDecision, [
            correoDecision(
              {
                ...evento(a),
                para: a.invitadoCorreo,
                nombre: nombre(a),
                aprobada: a.estado === 'PROGRAMADA',
                motivo: a.motivoRechazo,
              },
              cfg.minutosQrAntes,
            ),
          ])
        else omitir(canal, a.notifDecision)
      }

      if (disponible(a.notifConfirmacion, ahoraIso)) {
        const canal: Canal = { hoja: 'asignacion', id: a.id, campo: 'notifConfirmacion' }
        if (estado !== 'PROGRAMADA' || !a.invitadoCorreo)
          omitir(canal, a.notifConfirmacion) // ya confirmó, se anuló o venció
        else if (ahora.getTime() >= new Date(a.inicio).getTime())
          tomar(canal, a.notifConfirmacion, [
            correoConfirmacion({ ...evento(a), para: a.invitadoCorreo, nombre: nombre(a) }),
          ])
      }

      if (disponible(a.notifVencida, ahoraIso)) {
        const canal: Canal = { hoja: 'asignacion', id: a.id, campo: 'notifVencida' }
        if (estado === 'DEVOLUCION_VENCIDA') {
          const para = ctx.catalogo.destinatarios('vencida')
          const conRespaldo = para.length
            ? para
            : ctx.catalogo
                .entregadores()
                .filter((e) => e.activo)
                .map((e) => e.correo)
          if (conRespaldo.length && a.receptor && a.consecutivo)
            tomar(canal, a.notifVencida, [
              correoVencida(
                conRespaldo,
                {
                  ...evento(a),
                  receptorNombre: a.receptor.nombre,
                  receptorCorreo: a.receptor.correo,
                  consecutivo: a.consecutivo,
                },
                cfg.horasDevolucion,
              ),
            ])
          else omitir(canal, a.notifVencida)
        } else if (estado !== 'RECIBIDA') omitir(canal, a.notifVencida) // devuelta o anulada
      }
    }

    const porId = new Map(ctx.asignaciones.listar().map((a) => [a.id, a]))
    for (const { consecutivo, notif } of ctx.recepciones.notificaciones()) {
      if (!disponible(notif, ahoraIso)) continue
      const canal: Canal = { hoja: 'recepcion', consecutivo }
      const r = ctx.recepciones.porConsecutivo(consecutivo)
      const a = r ? porId.get(r.asignacionId) : undefined
      // Constancias selladas antes de activar el correo no se notifican de golpe.
      if (!r || !a || (cfg.notificacionesDesde && r.selladaEn < cfg.notificacionesDesde)) {
        omitir(canal, notif)
        continue
      }
      const datos = {
        ...evento(a),
        consecutivo: r.consecutivo,
        codigoVerificacion: r.codigoVerificacion,
        receptorNombre: r.receptor.nombre,
        receptorCorreo: r.receptor.correo,
        dependencia: r.dependencia,
        novedades: ctx.recepciones.detalle(consecutivo).filter((d) => d.estado === 'NOVEDAD')
          .length,
        devolverAntesDe: isoBogota(new Date(new Date(a.fin).getTime() + cfg.horasDevolucion * HORA_MS)),
      }
      const fijos = ctx.catalogo.destinatarios('recepcion')
      tomar(canal, notif, [
        correoConstanciaReceptor(datos),
        ...(fijos.length ? [correoConstanciaDestinatarios(fijos, datos)] : []),
      ])
    }
    return elegidos
  })

  /* ─── 2. Enviar, fuera del bloqueo ─── */
  const resultados: { t: Trabajo; ok: boolean | 'cuota'; error?: string }[] = []
  let sinCuota = false
  for (const t of trabajos) {
    const necesarios = t.mensajes.reduce((n, m) => n + m.para.length, 0)
    if (sinCuota || correo.cuotaRestante() < necesarios) {
      sinCuota = true
      resultados.push({ t, ok: 'cuota' })
      continue
    }
    try {
      for (const m of t.mensajes) correo.enviar(m)
      resultados.push({ t, ok: true })
    } catch (e) {
      resultados.push({ t, ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  /* ─── 3. Marcar ─── */
  if (resultados.length)
    ctx.srv.conBloqueo(() => {
      for (const { t, ok, error } of resultados) {
        if (ok === true) {
          marcar(ctx, t.canal, { ...t.notif, estado: 'ENVIADO', reservaHasta: '' })
          resumen.enviados++
        } else if (ok === 'cuota') {
          // Sin gastar intento: sale en el próximo turno, cuando haya cuota.
          marcar(ctx, t.canal, { ...t.notif, estado: 'PENDIENTE', reservaHasta: '' })
          resumen.reintentar++
        } else {
          const intentos = t.notif.intentos + 1
          const agotado = intentos >= INTENTOS_MAX
          marcar(ctx, t.canal, {
            estado: agotado ? 'FALLIDO' : 'PENDIENTE',
            intentos,
            reservaHasta: '',
          })
          if (agotado) {
            ctx.bitacora.registrar('notificacion.fallida', destinatariosDe(t.canal), 'sistema', {
              error,
            })
            resumen.fallidos++
          } else resumen.reintentar++
        }
      }
    })
  return resumen
}

function marcar(ctx: Contexto, canal: Canal, n: Notificacion) {
  if (canal.hoja === 'recepcion') ctx.recepciones.marcarNotificacion(canal.consecutivo, n)
  else ctx.asignaciones.actualizar(canal.id, { [canal.campo]: n })
}
