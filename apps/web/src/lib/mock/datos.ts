import type { Asignacion, ElementoCatalogo, Espacio, Persona } from '@check-auditorio/shared'

/*
 * Datos de ejemplo para la fase de interfaz.
 * El catálogo replica la versión anterior del acta; Infraestructura lo definirá en el Sheet.
 */

export const MOCK_USUARIO_INFRAESTRUCTURA: Persona = {
  nombre: 'Carlos Méndez',
  correo: 'carlos.mendez@americana.edu.co',
}

export const MOCK_RECEPTOR: Persona = {
  nombre: 'Laura Pérez Gómez',
  correo: 'laura.perez@americana.edu.co',
}

export const MOCK_ESPACIOS: Espacio[] = [
  { id: 'esp-auditorio', nombre: 'Auditorio Principal', ubicacion: 'Sede Prado', capacidad: 150 },
]

const e = (
  id: string,
  nombre: string,
  categoria: ElementoCatalogo['categoria'],
  cantidadEsperada: number,
  orden: number,
): ElementoCatalogo => ({
  id,
  espacioId: 'esp-auditorio',
  nombre,
  categoria,
  cantidadEsperada,
  orden,
})

export const MOCK_CATALOGO: ElementoCatalogo[] = [
  e('el-microfono', 'Micrófono', 'EQUIPO', 1, 1),
  e('el-computador', 'Computador', 'EQUIPO', 1, 2),
  e('el-pantallas', 'Pantallas', 'EQUIPO', 3, 3),
  e('el-videobeam', 'Video beam', 'EQUIPO', 2, 4),
  e('el-consola', 'Consola', 'EQUIPO', 1, 5),
  e('el-sillas', 'Sillas', 'MOBILIARIO', 150, 6),
  e('es-piso', 'Piso', 'ESPACIO', 1, 10),
  e('es-paredes', 'Paredes', 'ESPACIO', 1, 11),
  e('es-techo', 'Techo', 'ESPACIO', 1, 12),
  e('es-puertas', 'Puertas', 'ESPACIO', 1, 13),
  e('es-iluminacion', 'Iluminación', 'ESPACIO', 1, 14),
  e('es-aire', 'Aire acondicionado', 'ESPACIO', 1, 15),
  e('es-limpieza', 'Limpieza general', 'ESPACIO', 1, 16),
  e('es-mesas', 'Mesas', 'ESPACIO', 1, 17),
  e('es-tarima', 'Tarima / escenario', 'ESPACIO', 1, 18),
  e('es-cortinas', 'Cortinas', 'ESPACIO', 1, 19),
  e('es-senalizacion', 'Señalización', 'ESPACIO', 1, 20),
]

const base = {
  espacioId: 'esp-auditorio',
  entregadoPor: MOCK_USUARIO_INFRAESTRUCTURA,
  creadaEn: '2026-09-14T15:00:00-05:00',
} as const

export const MOCK_ASIGNACIONES: Asignacion[] = [
  {
    ...base,
    id: 'asg-001',
    evento: 'Foro de Investigación Contable',
    inicio: '2026-09-15T08:00:00-05:00',
    fin: '2026-09-15T11:00:00-05:00',
    estado: 'RECIBIDA',
    receptor: MOCK_RECEPTOR,
    consecutivo: 'REC-000123',
  },
  {
    ...base,
    id: 'asg-002',
    evento: 'Inducción docentes nuevos 2026-2',
    inicio: '2026-09-15T14:00:00-05:00',
    fin: '2026-09-15T17:00:00-05:00',
    estado: 'EN_VALIDACION',
    receptor: { nombre: 'Andrés Castillo Ruiz', correo: 'andres.castillo@americana.edu.co' },
    consecutivo: null,
  },
  {
    ...base,
    id: 'asg-003',
    evento: 'Conversatorio Bienestar Institucional',
    inicio: '2026-09-15T18:00:00-05:00',
    fin: '2026-09-15T20:30:00-05:00',
    estado: 'PROGRAMADA',
    receptor: null,
    consecutivo: null,
  },
  {
    ...base,
    id: 'asg-004',
    evento: 'Semana de la Ingeniería — clausura',
    inicio: '2026-09-14T15:00:00-05:00',
    fin: '2026-09-14T18:00:00-05:00',
    estado: 'DEVOLUCION_VENCIDA',
    receptor: { nombre: 'María José Ortega', correo: 'maria.ortega@americana.edu.co' },
    consecutivo: 'REC-000122',
  },
]

export const MOCK_TERMINOS = {
  version: 'v0.1-borrador',
  vigenteDesde: '2026-09-15',
  clausulas: [
    'Recibo el espacio y los elementos relacionados para uso exclusivo del evento y en el horario indicados en esta constancia.',
    'Verifiqué el estado y la cantidad de cada elemento. Lo registrado como “conforme” corresponde a lo que recibí; las novedades quedaron descritas y con foto.',
    'Durante el préstamo soy responsable de la custodia del espacio y de sus elementos. No retiraré elementos del espacio ni permitiré su traslado sin autorización de Infraestructura.',
    'Reportaré de inmediato a Infraestructura cualquier daño, pérdida o falla que ocurra durante el uso.',
    'Al terminar el evento declararé la devolución desde el enlace que recibiré por correo, indicando si el espacio se entrega en buenas condiciones o con novedades.',
    'Las diferencias que se detecten en la siguiente entrega del espacio y que no hayan sido reportadas podrán asociarse a este préstamo.',
  ],
  tratamientoDatos:
    'Autorizo a la Corporación Universitaria Americana a tratar mis datos de identificación y contacto, así como las fotografías que adjunte, con la finalidad de registrar y hacer seguimiento a la entrega y devolución del espacio, conforme a la Ley 1581 de 2012 y a la política de tratamiento de datos de la institución.',
} as const
