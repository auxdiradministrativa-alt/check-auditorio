import type { Asignacion, Espacio } from '@check-auditorio/shared'
import { ETIQUETAS_ESTADO_ASIGNACION } from '@check-auditorio/shared'

export function exportarRegistro(asignaciones: Asignacion[], espacios: Espacio[]) {
  // Neutraliza fórmulas al abrir CSV en Excel, también en textos aportados por usuarios.
  const celda = (valor: string) =>
    `"${(/^[\s]*[=+@-]/.test(valor) ? `'${valor}` : valor).replaceAll('"', '""')}"`
  const filas = [
    [
      'Evento',
      'Espacio',
      'Inicio',
      'Fin',
      'Estado',
      'Recibió',
      'Correo',
      'Consecutivo',
      'Cuenta invitada',
      'Motivo de corrección',
    ],
    ...asignaciones.map((a) => {
      // Una invitación aún no tiene franja: inicio = fin = creación, no una reserva real.
      const sinFranja = a.estado === 'INVITADA'
      return [
        a.evento,
        espacios.find((e) => e.id === a.espacioId)?.nombre ?? a.espacioId,
        sinFranja ? 'Por definir' : a.inicio,
        sinFranja ? 'Por definir' : a.fin,
        ETIQUETAS_ESTADO_ASIGNACION[a.estado],
        a.receptor?.nombre ?? '',
        a.receptor?.correo ?? '',
        a.consecutivo ?? '',
        a.invitadoCorreo ?? '',
        a.estado === 'RECHAZADA' ? (a.motivoRechazo ?? '') : '',
      ]
    }),
  ]
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', filas.map((fila) => fila.map(celda).join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'registro-de-eventos.csv'
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
