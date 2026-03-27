/**
 * Common API Types
 * Tipos compartidos para requests/responses de la API SIRES.
 *
 * @description Interfaces para paginación y respuestas estándar.
 * Todos los campos usan camelCase según el estándar de la API.
 */

// =============================================================================
// PAGINATION
// =============================================================================

/**
 * Parámetros de paginación para listados.
 * Usados como query params en endpoints GET con paginación.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Respuesta paginada genérica para listados.
 * Estructura estándar para todos los endpoints que retornan listas.
 */
export interface ListResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// =============================================================================
// STANDARD RESPONSES
// =============================================================================

/**
 * Respuesta estándar para operaciones exitosas sin datos.
 * Usada en: logout, delete, activate/deactivate, etc.
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

/**
 * Respuesta estándar de error de la API.
 * Estructura consistente para todos los errores del backend.
 */
export interface ErrorResponse {
  code: string;
  message: string;
  status: number;
  details?: Record<string, string[]>;
  requestId?: string;
  timestamp?: string;
}
