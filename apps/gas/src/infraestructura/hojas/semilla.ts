import type { Fila, NombreHoja } from './esquema'

/*
 * Contenido inicial de las pestañas editables. Lo usan `instalar()` (solo en pestañas vacías)
 * y la memoria local. Después Infraestructura lo mantiene directamente en el Sheet.
 */

const elemento = (
  id: string,
  nombre: string,
  categoria: 'EQUIPO' | 'MOBILIARIO' | 'ESPACIO',
  cantidad: number,
  orden: number,
): Fila<'CAT_Elementos'> => ({
  id,
  espacio_id: 'esp-auditorio',
  nombre,
  categoria,
  cantidad_esperada: String(cantidad),
  orden: String(orden),
  activo: 'SI',
})

const CLAUSULAS_BORRADOR = [
  'Recibo el espacio y los elementos relacionados para uso exclusivo del evento y en el horario indicados en esta constancia.',
  'Verifiqué el estado y la cantidad de cada elemento. Lo registrado como “conforme” corresponde a lo que recibí; las novedades quedaron descritas y con foto.',
  'Durante el préstamo soy responsable de la custodia del espacio y de sus elementos. No retiraré elementos del espacio ni permitiré su traslado sin autorización de Infraestructura.',
  'Reportaré de inmediato a Infraestructura cualquier daño, pérdida o falla que ocurra durante el uso.',
  'Al terminar el evento declararé la devolución desde el enlace de mi constancia, indicando si el espacio se entrega en buenas condiciones o con novedades.',
  'Las diferencias que se detecten en la siguiente entrega del espacio y que no hayan sido reportadas podrán asociarse a este préstamo.',
]

const DATOS_BORRADOR =
  'Autorizo a la Corporación Universitaria Americana a tratar mis datos de identificación y contacto, así como las fotografías que adjunte, con la finalidad de registrar y hacer seguimiento a la entrega y devolución del espacio, conforme a la Ley 1581 de 2012 y a la política de tratamiento de datos de la institución.'

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
        ubicacion: 'Sede Prado',
        capacidad: '150',
        activo: 'SI',
      },
    ],
    CAT_Elementos: [
      elemento('el-microfono', 'Micrófono', 'EQUIPO', 1, 1),
      elemento('el-computador', 'Computador', 'EQUIPO', 1, 2),
      elemento('el-pantallas', 'Pantallas', 'EQUIPO', 3, 3),
      elemento('el-videobeam', 'Video beam', 'EQUIPO', 2, 4),
      elemento('el-consola', 'Consola', 'EQUIPO', 1, 5),
      elemento('el-sillas', 'Sillas', 'MOBILIARIO', 150, 6),
      elemento('es-piso', 'Piso', 'ESPACIO', 1, 10),
      elemento('es-paredes', 'Paredes', 'ESPACIO', 1, 11),
      elemento('es-techo', 'Techo', 'ESPACIO', 1, 12),
      elemento('es-puertas', 'Puertas', 'ESPACIO', 1, 13),
      elemento('es-iluminacion', 'Iluminación', 'ESPACIO', 1, 14),
      elemento('es-aire', 'Aire acondicionado', 'ESPACIO', 1, 15),
      elemento('es-limpieza', 'Limpieza general', 'ESPACIO', 1, 16),
      elemento('es-mesas', 'Mesas', 'ESPACIO', 1, 17),
      elemento('es-tarima', 'Tarima / escenario', 'ESPACIO', 1, 18),
      elemento('es-cortinas', 'Cortinas', 'ESPACIO', 1, 19),
      elemento('es-senalizacion', 'Señalización', 'ESPACIO', 1, 20),
    ],
    CFG_Entregadores: [
      { correo: 'auxdiradministrativa@americana.edu.co', nombre: 'Infraestructura', activo: 'SI' },
    ],
    CFG_Terminos: [
      {
        version: 'v0.1-borrador',
        texto_clausulas: clausulas,
        texto_datos: DATOS_BORRADOR,
        sha256: huellaTerminos(sha256Hex, clausulas, DATOS_BORRADOR),
        vigente: 'SI',
      },
    ],
    CFG_General: [
      { clave: 'minutos_vigencia_qr_antes', valor: '30' },
      { clave: 'horas_plazo_devolucion', valor: '24' },
      { clave: 'carpeta_fotos_id', valor: '' },
    ],
  }
}
