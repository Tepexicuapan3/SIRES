/**
 * Clinicas Schema
 *
 * Catálogo de clínicas del Metro CDMX.
 * Basado en estándares definidos en: standards.md
 */

import { z } from "zod";
import { ListResponseSchema } from "./common/pagination.schema";

/**
 * Entidad Clínica
 *
 * Representa una clínica donde pueden ser asignados usuarios.
 * Machea con la tabla cat_clinicas de MySQL (después de conversión a camelCase en backend).
 */
export const ClinicaSchema = z.object({
  id: z.number().int().positive("ID de clínica debe ser positivo"),
  nombre: z
    .string()
    .min(1, "Nombre de clínica es requerido")
    .max(255, "Nombre de clínica no puede tener más de 255 caracteres"),
  folio: z
    .string()
    .min(1, "Folio de clínica es requerido")
    .max(10, "Folio de clínica no puede tener más de 10 caracteres"),
});

/**
 * Tipo inferido de Clínica
 */
export type Clinica = z.infer<typeof ClinicaSchema>;

/**
 * Request params para listado de clínicas
 * Aunque las clínicas no tienen paginación en el diseño actual,
 * usamos la estructura estándar para consistencia.
 */
export const ClinicasListParamsSchema = z.object({}).optional();

/**
 * Tipo de params de listado
 */
export type ClinicasListParams = z.infer<typeof ClinicasListParamsSchema>;

/**
 * Response para GET /api/v1/clinicas
 *
 * Estructura estándar de listado (aunque sin paginación).
 */
export const ClinicasListResponseSchema = ListResponseSchema(ClinicaSchema);

/**
 * Tipo de response de listado
 */
export type ClinicasListResponse = z.infer<typeof ClinicasListResponseSchema>;
