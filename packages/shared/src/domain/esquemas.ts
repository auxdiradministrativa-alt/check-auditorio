import { z } from 'zod'

import { LIMITES } from './constantes'
import {
  CATEGORIAS_ELEMENTO,
  ESTADOS_ASIGNACION,
  ESTADOS_ELEMENTO,
  RESULTADOS_DEVOLUCION,
  ROLES_RECEPTOR,
} from './estados'

const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`)

/* ───────────────────────── Catálogo (lo administra Infraestructura en el Sheet) ───────────────────────── */

export const espacioSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  ubicacion: z.string().min(1),
  capacidad: z.number().int().positive(),
})
export type Espacio = z.infer<typeof espacioSchema>

export const elementoCatalogoSchema = z.object({
  id: z.string().min(1),
  espacioId: z.string().min(1),
  nombre: z.string().min(1),
  categoria: z.enum(CATEGORIAS_ELEMENTO),
  cantidadEsperada: z.number().int().nonnegative(),
  orden: z.number().int(),
})
export type ElementoCatalogo = z.infer<typeof elementoCatalogoSchema>

/* ───────────────────────── Personas ───────────────────────── */

export const personaSchema = z.object({
  nombre: z.string().min(1),
  correo: z.email(),
})
export type Persona = z.infer<typeof personaSchema>

/* ───────────────────────── Asignación ───────────────────────── */

export const asignacionSchema = z.object({
  id: z.string().min(1),
  espacioId: z.string().min(1),
  evento: z.string().min(1),
  inicio: z.iso.datetime({ offset: true }),
  fin: z.iso.datetime({ offset: true }),
  estado: z.enum(ESTADOS_ASIGNACION),
  entregadoPor: personaSchema,
  receptor: personaSchema.nullable(),
  consecutivo: z.string().nullable(),
  creadaEn: z.iso.datetime({ offset: true }),
})
export type Asignacion = z.infer<typeof asignacionSchema>

/** Datos que diligencia Infraestructura al programar una entrega. */
export const nuevaAsignacionInputSchema = z
  .object({
    espacioId: z.string().min(1, 'Selecciona el espacio.'),
    evento: texto(LIMITES.eventoMax).min(3, 'Escribe el nombre del evento.'),
    inicio: z.iso.datetime({ offset: true, error: 'Fecha y hora de inicio inválidas.' }),
    fin: z.iso.datetime({ offset: true, error: 'Fecha y hora de fin inválidas.' }),
  })
  .refine((d) => new Date(d.fin) > new Date(d.inicio), {
    path: ['fin'],
    error: 'La hora de fin debe ser posterior al inicio.',
  })
export type NuevaAsignacionInput = z.infer<typeof nuevaAsignacionInputSchema>

/* ───────────────────────── Recepción (lo que envía el navegador) ─────────────────────────
 * Solo contiene lo que la persona decide. Identidad, hora, espacio, cantidades esperadas,
 * versión de términos y sello los agrega el servidor.
 */

export const checklistItemInputSchema = z
  .object({
    elementoId: z.string().min(1),
    cantidadRecibida: z.number().int().nonnegative(),
    estado: z.enum(ESTADOS_ELEMENTO, { error: 'Marca el estado del elemento.' }),
    observacion: texto(LIMITES.observacionMax).default(''),
    fotoIds: z.array(z.string().min(1)).max(LIMITES.fotosPorNovedadMax).default([]),
  })
  .superRefine((item, ctx) => {
    if (item.estado !== 'NOVEDAD') return
    if (item.observacion.length < LIMITES.observacionMinNovedad) {
      ctx.addIssue({
        code: 'custom',
        path: ['observacion'],
        message: 'Describe la novedad.',
      })
    }
    if (item.fotoIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['fotoIds'],
        message: 'Adjunta al menos una foto de la novedad.',
      })
    }
  })
export type ChecklistItemInput = z.infer<typeof checklistItemInputSchema>

export const recepcionInputSchema = z.object({
  claveIdempotencia: z.uuid(),
  rol: z.enum(ROLES_RECEPTOR, { error: 'Selecciona tu rol.' }),
  dependencia: texto(LIMITES.dependenciaMax).min(2, 'Escribe tu dependencia.'),
  cargo: texto(LIMITES.cargoMax).default(''),
  celular: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, 'Celular colombiano de 10 dígitos (ej. 3001234567).'),
  asistentesEstimados: z.number().int().positive('Indica cuántas personas asistirán.'),
  checklist: z.array(checklistItemInputSchema).min(1),
  aceptaTerminos: z.literal(true, { error: 'Debes aceptar los términos y condiciones.' }),
  autorizaDatos: z.literal(true, { error: 'Debes autorizar el tratamiento de datos.' }),
})
export type RecepcionInput = z.infer<typeof recepcionInputSchema>

/* ───────────────────────── Devolución (la declara solo quien recibió) ───────────────────────── */

export const devolucionInputSchema = z
  .object({
    claveIdempotencia: z.uuid(),
    resultado: z.enum(RESULTADOS_DEVOLUCION, { error: 'Indica cómo devuelves el espacio.' }),
    novedades: z
      .array(
        z.object({
          elementoId: z.string().min(1),
          observacion: texto(LIMITES.observacionMax).min(
            LIMITES.observacionMinNovedad,
            'Describe la novedad.',
          ),
          fotoIds: z.array(z.string().min(1)).min(1, 'Adjunta al menos una foto.'),
        }),
      )
      .default([]),
    declaracion: z.literal(true, { error: 'Debes confirmar la declaración.' }),
  })
  .refine((d) => d.resultado === 'BUENAS_CONDICIONES' || d.novedades.length > 0, {
    path: ['novedades'],
    error: 'Registra al menos una novedad.',
  })
export type DevolucionInput = z.infer<typeof devolucionInputSchema>
