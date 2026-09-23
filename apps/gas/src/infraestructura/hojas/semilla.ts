import type { Fila, NombreHoja } from './esquema'

/*
 * Contenido inicial de las pestañas editables. Lo usan `instalar()` (solo en pestañas vacías)
 * y la memoria local. Después Infraestructura lo mantiene directamente en el Sheet.
 */

/**
 * Aspectos de infraestructura que valida quien recibe, en el orden del proceso manual
 * (lista oficial de Infraestructura, 2026-09-23). Sin equipos electrónicos ni cantidades.
 */
const ASPECTOS: [id: string, nombre: string][] = [
  ['as-estado-general', 'Estado general del auditorio'],
  ['as-pisos', 'Pisos'],
  ['as-muros', 'Muros y pintura'],
  ['as-puertas', 'Puertas y accesos'],
  ['as-iluminacion', 'Iluminación'],
  ['as-aire', 'Sistema de aire acondicionado'],
  ['as-sillas', 'Sillas y mobiliario'],
  ['as-electricas', 'Tomas e instalaciones eléctricas visibles'],
  ['as-aseo', 'Condiciones de aseo y organización'],
  ['as-condiciones', 'Condiciones generales del espacio'],
]

const CLAUSULAS_BORRADOR = [
  'Recibo el espacio para uso exclusivo del evento y en el horario indicados en esta constancia.',
  'Verifiqué el estado de cada aspecto del espacio. Lo registrado como “conforme” corresponde a lo que recibí; las novedades quedaron descritas y con foto.',
  'Durante el préstamo soy responsable de la custodia del espacio, sus instalaciones y su mobiliario. No retiraré mobiliario del espacio ni permitiré su traslado sin autorización de Infraestructura.',
  'Reportaré de inmediato a Infraestructura cualquier daño, pérdida o falla que ocurra durante el uso.',
  'Al terminar el evento declararé la devolución desde el enlace de mi constancia, indicando si el espacio se entrega en buenas condiciones o con novedades.',
  'Las diferencias que se detecten en la siguiente entrega del espacio y que no hayan sido reportadas podrán asociarse a este préstamo.',
]

const DATOS_BORRADOR =
  'Autorizo a la Corporación Universitaria Americana a tratar mis datos de identificación y contacto, así como las fotografías que adjunte, con la finalidad de registrar y hacer seguimiento a la entrega y devolución del espacio, conforme a la Ley 1581 de 2012 y a la política de tratamiento de datos de la institución.'

export const URL_APP_POR_DEFECTO = 'https://check-auditorio-web.vercel.app'

/**
 * Claves de `CFG_General`. `instalar()` añade a un libro existente las que le falten, con este
 * valor; `notificaciones_desde` vacía la completa con la hora de la instalación.
 */
export const CFG_GENERAL: Fila<'CFG_General'>[] = [
  { clave: 'horas_plazo_devolucion', valor: '24' },
  { clave: 'horas_vigencia_invitacion', valor: '72' },
  { clave: 'url_app', valor: URL_APP_POR_DEFECTO },
  { clave: 'notificaciones_desde', valor: '' },
  { clave: 'carpeta_fotos_id', valor: '' },
]

/** Huella de los términos: la calcula quien siembra con su propia primitiva SHA-256. */
export const huellaTerminos = (
  sha256Hex: (t: string) => string,
  clausulasJson: string,
  datos: string,
) => sha256Hex(`${clausulasJson}\n${datos}`)

export function semilla(sha256Hex: (t: string) => string): { [H in NombreHoja]?: Fila<H>[] } {
  const clausulas = JSON.stringify(CLAUSULAS_BORRADOR)
  return {
    CAT_Espacios: [
      {
        id: 'esp-auditorio',
        nombre: 'Auditorio Principal',
        ubicacion: 'Sede Cosmos',
        capacidad: '150',
        activo: 'SI',
      },
    ],
    CAT_Elementos: ASPECTOS.map(([id, nombre], i) => ({
      id,
      espacio_id: 'esp-auditorio',
      nombre,
      orden: String(i + 1),
      activo: 'SI',
    })),
    CFG_Entregadores: [
      { correo: 'auxdiradministrativa@americana.edu.co', nombre: 'Infraestructura', activo: 'SI' },
    ],
    CFG_Terminos: [
      {
        version: 'v0.2-borrador',
        texto_clausulas: clausulas,
        texto_datos: DATOS_BORRADOR,
        sha256: huellaTerminos(sha256Hex, clausulas, DATOS_BORRADOR),
        vigente: 'SI',
      },
    ],
    CFG_General: CFG_GENERAL.map((f) => ({ ...f })),
  }
}
