import type { Entrada, Salida } from '@check-auditorio/shared/sin-zod'
import {
  estadoEfectivo,
  exigirInvitado,
  exigirReceptor,
  vigenciaQr,
} from '../../dominio/asignacion'
import { fallar } from '../../dominio/errores'
import type { Contexto } from '../puertos'
import { exigirAsignacion, releer, vista } from './comun'

export function iniciarRecepcion(
  ctx: Contexto,
  { id, receptor }: Entrada<'recepcion.iniciar'>,
): Salida<'recepcion.iniciar'> {
  return ctx.srv.conBloqueo(() => {
    const a = exigirAsignacion(ctx, id)
    exigirInvitado(a, receptor.correo)
    if (a.receptor) exigirReceptor(a, receptor.sub)
    const cfg = ctx.catalogo.config()
    const ahora = ctx.srv.ahora()
    if (a.estado === 'EN_DILIGENCIAMIENTO') {
      if (vigenciaQr(a, ahora) !== 'VIGENTE')
        fallar('QR_NO_VIGENTE', 'El plazo para recibir este espacio ha finalizado.')
      return vista(ctx, a)
    }
    if (estadoEfectivo(a, ahora, cfg) !== 'PROGRAMADA')
      fallar('ESTADO_INVALIDO', 'Esta entrega no está lista para recibir el espacio.')
    if (vigenciaQr(a, ahora) !== 'VIGENTE')
      fallar('QR_NO_VIGENTE', 'El plazo para recibir este espacio ha finalizado.')
    ctx.asignaciones.actualizar(id, { estado: 'EN_DILIGENCIAMIENTO', receptor })
    ctx.bitacora.registrar('recepcion.iniciar', id, receptor.correo)
    return releer(ctx, id)
  })
}
