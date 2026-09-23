import type { Entrada, NombreAccion, Respuesta, Salida } from '@check-auditorio/shared/sin-zod'

import { ErrorDominio } from '../dominio/errores'
import {
  anularAsignacion,
  crearAsignacion,
  listarAsignaciones,
  obtenerAsignacion,
} from './casos/asignaciones'
import { entregadorAutorizado, listarCatalogo, terminosVigentes } from './casos/catalogo'
import { obtenerConstancia } from './casos/constancia'
import { registrarDevolucion } from './casos/devolucion'
import { decidirValidacion, estadoQr, reclamarQr } from './casos/qr-validacion'
import { registrarRecepcion, subirFoto } from './casos/recepcion'
import {
  crearInvitacion,
  decidirSolicitud,
  diligenciarSolicitud,
  iniciarRecepcion,
} from './casos/solicitud'
import type { Contexto } from './puertos'

type Tabla = { [A in NombreAccion]: (ctx: Contexto, e: Entrada<A>) => Salida<A> }

/** Única tabla acción → caso de uso. Añadir una acción = tipo en `Acciones` + una línea aquí. */
const CASOS: Tabla = {
  'catalogo.listar': listarCatalogo,
  'entregador.autorizado': entregadorAutorizado,
  'terminos.vigentes': terminosVigentes,
  'asignacion.listar': listarAsignaciones,
  'asignacion.obtener': obtenerAsignacion,
  'asignacion.crear': crearAsignacion,
  'asignacion.anular': anularAsignacion,
  'qr.estado': estadoQr,
  'qr.reclamar': reclamarQr,
  'validacion.decidir': decidirValidacion,
  'invitacion.crear': crearInvitacion,
  'solicitud.diligenciar': diligenciarSolicitud,
  'solicitud.decidir': decidirSolicitud,
  'recepcion.iniciar': iniciarRecepcion,
  'foto.subir': subirFoto,
  'recepcion.registrar': registrarRecepcion,
  'devolucion.registrar': registrarDevolucion,
  'constancia.obtener': obtenerConstancia,
}

export function ejecutar<A extends NombreAccion>(
  ctx: Contexto,
  accion: A,
  entrada: Entrada<A>,
): Respuesta<Salida<A>> {
  const caso = Object.prototype.hasOwnProperty.call(CASOS, accion)
    ? (CASOS[accion] as (c: Contexto, e: Entrada<A>) => Salida<A>)
    : null
  if (!caso) return { ok: false, codigo: 'DATOS_INVALIDOS', mensaje: 'Acción desconocida.' }
  try {
    return { ok: true, datos: caso(ctx, entrada) }
  } catch (error) {
    if (error instanceof ErrorDominio)
      return { ok: false, codigo: error.codigo, mensaje: error.message }
    console.error(`[${accion}]`, error)
    return { ok: false, codigo: 'INTERNO', mensaje: 'Error interno del registro.' }
  }
}
