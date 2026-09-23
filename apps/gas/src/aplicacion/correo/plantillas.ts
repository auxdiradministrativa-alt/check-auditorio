import type { Mensaje } from '../puertos'
import { COLORES as C } from './colores'

/*
 * Plantillas de correo: funciones puras (sin APIs de Google), probadas con node:test y
 * previsualizables con `pnpm --filter @check-auditorio/gas vista-correo`.
 *
 * Los clientes de correo no son navegadores: maquetación con tablas, estilos en línea, ancho
 * 600 px, botón «a prueba de clientes» con el enlace repetido en texto, tipografía de sistema
 * (Antic no carga en Gmail ni Outlook) y todo texto del usuario escapado.
 */

export const LIMITE_BYTES = 102 * 1024 // Gmail recorta el mensaje por encima

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const escapar = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** «martes 15 de septiembre de 2026» de un ISO de Bogotá; no depende de la zona del servidor. */
export function fechaLarga(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number) as [number, number, number]
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]
  return `${dia} ${d} de ${MESES[m - 1]} de ${a}`
}
export const hora = (iso: string) => iso.slice(11, 16)
export const franja = (inicio: string, fin: string) =>
  inicio.slice(0, 10) === fin.slice(0, 10)
    ? `${hora(inicio)} a ${hora(fin)}`
    : `${hora(inicio)} del ${fechaLarga(inicio)} a ${hora(fin)} del ${fechaLarga(fin)}`

const FUENTE = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

type Tono = 'info' | 'atencion' | 'alerta' | 'exito'
const TONOS: Record<Tono, { fondo: string; texto: string; borde: string }> = {
  info: { fondo: C['primary-soft'], texto: C.foreground, borde: C['primary-strong'] },
  atencion: { fondo: C['attention-soft'], texto: C.attention, borde: C['attention-accent'] },
  alerta: {
    fondo: C['destructive-soft'],
    texto: C['destructive-strong'],
    borde: C['destructive-strong'],
  },
  exito: { fondo: C['success-soft'], texto: C.success, borde: C.success },
}

export interface Carcasa {
  /** Texto que el buzón muestra junto al asunto. */
  preheader: string
  etiqueta: string
  titulo: string
  /** Párrafos en texto plano: se escapan aquí. */
  parrafos: string[]
  ficha: [clave: string, valor: string][]
  nota?: { tono: Tono; texto: string }
  cta?: { texto: string; url: string }
  logoUrl: string
}

/** HTML completo del correo. Único sitio con marcado: las plantillas solo aportan contenido. */
export function carcasa(c: Carcasa): string {
  const p = (texto: string) =>
    `<p style="margin:0 0 16px;font-family:${FUENTE};font-size:15px;line-height:24px;color:${C.foreground};">${escapar(texto)}</p>`

  const ficha = c.ficha.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;border-collapse:separate;background:${C.background};border:1px solid ${C.border};border-radius:8px;">
${c.ficha
  .map(
    (
      [k, v],
      i,
    ) => `<tr><td style="padding:12px 16px;${i ? `border-top:1px solid ${C.border};` : ''}font-family:${FUENTE};">
<div style="font-size:12px;line-height:16px;color:${C['muted-foreground']};">${escapar(k)}</div>
<div style="font-size:15px;line-height:22px;color:${C.foreground};font-weight:600;">${escapar(v)}</div>
</td></tr>`,
  )
  .join('\n')}
</table>`
    : ''

  const nota = c.nota
    ? (() => {
        const t = TONOS[c.nota.tono]
        return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
<tr><td style="padding:14px 16px;background:${t.fondo};border-left:4px solid ${t.borde};border-radius:4px;font-family:${FUENTE};font-size:14px;line-height:22px;color:${t.texto};">${escapar(c.nota.texto)}</td></tr>
</table>`
      })()
    : ''

  const url = c.cta ? escapar(c.cta.url) : ''
  const cta = c.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
<tr><td align="center" bgcolor="${C['primary-strong']}" style="border-radius:6px;background:${C['primary-strong']};">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FUENTE};font-size:15px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${escapar(c.cta.texto)}</a>
</td></tr>
</table>
<p style="margin:0 0 8px;font-family:${FUENTE};font-size:13px;line-height:20px;color:${C['muted-foreground']};">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:0 0 8px;font-family:${FUENTE};font-size:13px;line-height:20px;word-break:break-all;"><a href="${url}" target="_blank" style="color:${C['primary-strong']};text-decoration:underline;">${url}</a></p>`
    : ''

  // Relleno invisible tras el preheader: evita que el buzón muestre el resto del cuerpo.
  const relleno = '&#8199;&#65279;&#847; '.repeat(40)

  return `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapar(c.titulo)}</title>
<style>
@media (max-width: 620px) {
  .contenedor { width: 100% !important; }
  .relleno-x { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${C.background};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapar(c.preheader)}${relleno}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${C.background};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" class="contenedor" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;">

<tr><td class="relleno-x" style="padding:24px 32px;background:${C.foreground};border-radius:10px 10px 0 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="padding-right:14px;vertical-align:middle;"><img src="${escapar(c.logoUrl)}" width="36" height="47" alt="Escudo de la Corporación Universitaria Americana" style="display:block;border:0;outline:none;"></td>
<td style="vertical-align:middle;font-family:${FUENTE};">
<div style="font-size:15px;line-height:20px;font-weight:600;color:#ffffff;">Corporación Universitaria Americana</div>
<div style="font-size:13px;line-height:18px;color:${C.muted};">Infraestructura · Entrega de espacios</div>
</td></tr></table>
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${C['attention-accent']};">&nbsp;</td></tr>

<tr><td class="relleno-x" style="padding:32px;background:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
<p style="margin:0 0 8px;font-family:${FUENTE};font-size:13px;line-height:18px;font-weight:600;color:${C['primary-strong']};">${escapar(c.etiqueta)}</p>
<h1 style="margin:0 0 20px;font-family:${FUENTE};font-size:22px;line-height:30px;font-weight:600;color:${C.foreground};">${escapar(c.titulo)}</h1>
${c.parrafos.map(p).join('\n')}
${ficha}
${nota}
${cta}
</td></tr>

<tr><td class="relleno-x" style="padding:20px 32px 24px;background:${C.card};border:1px solid ${C.border};border-top:0;border-radius:0 0 10px 10px;font-family:${FUENTE};font-size:12px;line-height:18px;color:${C['muted-foreground']};">
Correo automático de Check Auditorio. No respondas a este mensaje: para cualquier novedad, comunícate con Infraestructura.<br>
Corporación Universitaria Americana · Tratamiento de datos conforme a la Ley 1581 de 2012.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

/** Versión en texto plano del mismo contenido (el mismo envío la lleva como alternativa). */
export function textoPlano(c: Carcasa): string {
  return [
    c.titulo,
    '',
    ...c.parrafos.flatMap((p) => [p, '']),
    ...c.ficha.map(([k, v]) => `${k}: ${v}`),
    '',
    ...(c.nota ? [c.nota.texto, ''] : []),
    ...(c.cta ? [`${c.cta.texto}: ${c.cta.url}`, ''] : []),
    '—',
    'Correo automático de Check Auditorio · Infraestructura · Corporación Universitaria Americana',
  ].join('\n')
}

const mensaje = (para: string[], asunto: string, c: Carcasa): Mensaje => ({
  para,
  asunto,
  html: carcasa(c),
  texto: textoPlano(c),
})

/* ─── Datos que necesitan las plantillas (los arma el caso de uso) ─── */

export interface DatosEvento {
  id: string
  evento: string
  espacio: string
  inicio: string
  fin: string
  urlApp: string
}

const fichaEvento = (e: DatosEvento): [string, string][] => [
  ['Evento', e.evento],
  ['Espacio', e.espacio],
  ['Fecha', fechaLarga(e.inicio)],
  ['Horario', franja(e.inicio, e.fin)],
]
const logo = (e: DatosEvento) => `${e.urlApp}/logo-americana.png`
/** Enlace estable para quien solicitó: la web exige su sesión y lo lleva al paso que toque. */
const miEntrega = (e: DatosEvento) => `${e.urlApp}/mi-entrega/${encodeURIComponent(e.id)}`

/* ─── Los cuatro correos ─── */

export function correoEntrega(
  e: DatosEvento & { para: string; nombre: string },
  minutosAntes: number,
): Mensaje {
  return mensaje([e.para], `Entrega programada · ${e.evento}`, {
    preheader: `La entrega del ${fechaLarga(e.inicio)} está programada.`,
    etiqueta: 'Entrega programada',
    titulo: 'Tu entrega está programada',
    parrafos: [
      `Hola, ${e.nombre}. Infraestructura preparó la entrega del espacio para ti.`,
      'El día del evento te enviaremos un correo para que confirmes la recepción del espacio y su estado.',
    ],
    ficha: fichaEvento(e),
    nota: {
      tono: 'info',
      texto: `Podrás confirmar la recepción desde ${minutosAntes} minutos antes del inicio y hasta la hora de finalización.`,
    },
    cta: { texto: 'Ver mi entrega', url: miEntrega(e) },
    logoUrl: logo(e),
  })
}

export function correoConfirmacion(e: DatosEvento & { para: string; nombre: string }): Mensaje {
  return mensaje([e.para], `Confirma la recepción del espacio · ${e.evento}`, {
    preheader: 'Tu evento empezó. Confirma el estado del espacio que recibiste.',
    etiqueta: 'Hoy es tu evento',
    titulo: 'Confirma que recibiste el espacio',
    parrafos: [
      `Hola, ${e.nombre}. Tu evento ya empezó. Revisa el estado del espacio y confírmalo.`,
      'Tu confirmación queda como constancia de la entrega, con consecutivo y código de verificación.',
    ],
    ficha: fichaEvento(e),
    nota: {
      tono: 'atencion',
      texto: `Si algo no está en buen estado, repórtalo desde el mismo enlace con una foto. Puedes confirmar hasta las ${hora(e.fin)}.`,
    },
    cta: { texto: 'Confirmar recepción', url: miEntrega(e) },
    logoUrl: logo(e),
  })
}

export interface DatosConstancia extends DatosEvento {
  consecutivo: string
  codigoVerificacion: string
  receptorNombre: string
  receptorCorreo: string
  dependencia: string
  novedades: number
  devolverAntesDe: string
}

/** Al receptor: su enlace personal (devolución incluida). */
export function correoConstanciaReceptor(d: DatosConstancia): Mensaje {
  return mensaje([d.receptorCorreo], `Constancia ${d.consecutivo} · ${d.evento}`, {
    preheader: `Quedó registrada tu recepción del espacio con el consecutivo ${d.consecutivo}.`,
    etiqueta: 'Constancia de recepción',
    titulo: 'Recibiste el espacio',
    parrafos: [
      `Hola, ${d.receptorNombre}. Tu recepción quedó sellada. Guarda este correo: es tu comprobante.`,
    ],
    ficha: [
      ['Consecutivo', d.consecutivo],
      ['Código de verificación', d.codigoVerificacion],
      ...fichaEvento(d),
      ['Novedades reportadas', d.novedades ? String(d.novedades) : 'Ninguna'],
    ],
    nota: {
      tono: 'info',
      texto: `Al terminar, declara la devolución desde tu enlace antes del ${fechaLarga(d.devolverAntesDe)} a las ${hora(d.devolverAntesDe)}.`,
    },
    cta: { texto: 'Ver mi constancia y devolver', url: miEntrega(d) },
    logoUrl: logo(d),
  })
}

/** A los destinatarios fijos: sin celular ni enlaces personales del receptor. */
export function correoConstanciaDestinatarios(para: string[], d: DatosConstancia): Mensaje {
  return mensaje(para, `Nueva recepción ${d.consecutivo} · ${d.evento}`, {
    preheader: `${d.receptorNombre} recibió el espacio.`,
    etiqueta: 'Constancia de recepción',
    titulo: 'Se registró una recepción del espacio',
    parrafos: [`${d.receptorNombre} (${d.dependencia}) confirmó la recepción del espacio.`],
    ficha: [
      ['Consecutivo', d.consecutivo],
      ...fichaEvento(d),
      ['Novedades reportadas', d.novedades ? String(d.novedades) : 'Ninguna'],
    ],
    ...(d.novedades
      ? {
          nota: {
            tono: 'alerta' as const,
            texto:
              'Hay novedades con foto en la constancia. Revísalas antes de la siguiente entrega.',
          },
        }
      : {}),
    cta: {
      texto: 'Ver la constancia',
      url: `${d.urlApp}/verificar/${encodeURIComponent(d.consecutivo)}`,
    },
    logoUrl: logo(d),
  })
}

export function correoVencida(
  para: string[],
  d: DatosEvento & { receptorNombre: string; receptorCorreo: string; consecutivo: string },
  horasPlazo: number,
): Mensaje {
  return mensaje(para, `Devolución vencida · ${d.evento}`, {
    preheader: `${d.receptorNombre} no ha declarado la devolución del espacio.`,
    etiqueta: 'Alerta',
    titulo: 'La devolución del espacio está vencida',
    parrafos: [
      `Pasaron ${horasPlazo} horas desde el fin del evento y quien recibió el espacio no ha declarado la devolución.`,
    ],
    ficha: [
      ['Consecutivo', d.consecutivo],
      ['Recibió', `${d.receptorNombre} · ${d.receptorCorreo}`],
      ...fichaEvento(d),
    ],
    nota: {
      tono: 'alerta',
      texto:
        'Verifica el estado del espacio. Las diferencias que encuentres en la siguiente entrega se asociarán a este turno.',
    },
    cta: {
      texto: 'Abrir en el panel',
      url: `${d.urlApp}/panel?evento=${encodeURIComponent(d.id)}#operacion`,
    },
    logoUrl: logo(d),
  })
}
