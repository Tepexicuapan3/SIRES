/**
 * Pagination Schemas (Common)
 *
 * Schemas comunes para paginación de listados.
 * Basado en estándares definidos en: ../standards.md
 */

import { z } from "zod";

/**
 * Parámetros de paginación para listados
 * Basado en page-based pagination (1-based)
 */
export const PaginationParamsSchema = z.object({
  page: z
    .number()
    .int()
    .positive("La página debe ser mayor a 0")
    .default(1)
    .optional(),
  pageSize: z
    .number()
    .int()
    .positive("El tamaño de página debe ser mayor a 0")
    .max(100, "El tamaño máximo de página es 100")
    .default(20)
    .optional(),
  search: z
    .string()
    .max(255, "La búsqueda no puede tener más de 255 caracteres")
    .optional(),
  sortBy: z
    .string()
    .max(100, "El campo de ordenamiento no puede tener más de 100 caracteres")
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Tipo inferido de los parámetros de paginación
 */
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Helper para generar schema de respuesta paginada
 *
 * @example
 * ```typescript
 * import { ListResponseSchema } from './common/pagination.schema';
 * import { UserSchema } from './users.schema';
 *
 * const UserListResponseSchema = ListResponseSchema(UserSchema);
 * ```
 */
export const ListResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  });

/**
 * Tipo helper para respuestas paginadas
 */
export type ListResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
