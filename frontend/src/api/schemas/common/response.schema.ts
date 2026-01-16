/**
 * Response Schemas (Common)
 *
 * Schemas comunes para respuestas de API.
 * Basado en estándares definidos en: ../standards.md
 */

import { z } from "zod";
import { ListResponseSchema } from "./pagination.schema";

/**
 * Re-export de schemas de paginación para facilitar imports
 */
export {
  PaginationParamsSchema,
  type PaginationParams,
} from "./pagination.schema";
export { ListResponseSchema, type ListResponse } from "./pagination.schema";
export {
  ErrorCodeSchema,
  type ErrorCode,
  ApiErrorSchema,
  type ApiError,
  SuccessResponseSchema,
  type SuccessResponse,
} from "./error.schema";
