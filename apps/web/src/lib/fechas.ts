import { ZONA_HORARIA } from '@check-auditorio/shared'

const LOCALE = 'es-CO'

const fmtFechaLarga = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const fmtFechaCorta = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtHora = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const fmtFechaHora = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

const fmtHoraExacta = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

export const formatearHoraExacta = (iso: string | Date) => fmtHoraExacta.format(new Date(iso))
export const formatearFechaLarga = (iso: string | Date) => fmtFechaLarga.format(new Date(iso))
export const formatearFechaCorta = (iso: string | Date) => fmtFechaCorta.format(new Date(iso))
export const formatearHora = (iso: string | Date) => fmtHora.format(new Date(iso))
export const formatearFechaHora = (iso: string | Date) => fmtFechaHora.format(new Date(iso))

export const formatearFranja = (inicio: string, fin: string) =>
  `${formatearHora(inicio)} – ${formatearHora(fin)}`
