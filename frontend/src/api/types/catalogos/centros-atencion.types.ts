/**
 * Centros de Atencion Types - Pure TypeScript interfaces
 * Tipos para gestion completa de centros de atencion del Metro CDMX.
 *
 * @description Interfaces para CRUD de centros de atencion.
 * Todos los campos usan camelCase en inglés según el estándar de la API.
 *
 * Estrategia de entidades:
 * - CentroAtencionRef: Referencia minima para relaciones (ej: User.center)
 * - CentroAtencionListItem: Para tablas/listados (sin auditoria)
 * - CentroAtencionDetail: Para detalle/edicion (con auditoria completa)
 */

import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

/**
 * Referencia a centro de atencion (objeto anidado para relaciones).
 * Evita tener campos separados centerId + centerName.
 * Usado en relaciones con usuarios y otros recursos.
 */
export interface CentroAtencionRef {
  id: number;
  name: string;
}

/**
 * Centro de atencion para listado en tabla.
 * Incluye solo datos necesarios para identificar, filtrar y mostrar en tabla.
 * NO incluye campos de auditoria (optimizado para tablas).
 *
 * GET /api/v1/care-centers
 */
export interface CentroAtencionListItem {
  id: number;
  name: string;
  folioCode: string;
  isExternal: boolean;
  isActive: boolean;
}

/**
 * Centro de atencion con detalle completo para edicion.
 * Extiende CentroAtencionListItem con campos de auditoria.
 *
 * GET /api/v1/care-centers/:id
 */
export interface CentroAtencionDetail extends CentroAtencionListItem {
  // --- Auditoría de registro ---
  createdAt: string;
  createdBy: UserRef;
  updatedAt: string | null;
  updatedBy: UserRef | null;

  // --- Datos de control ---
  address: string;
  deletedAt: string | null;
  deletedBy: UserRef | null;

  // --- Horarios ---
  schedule: CentroAtencionSchedule;
}

export interface CentroAtencionSchedule {
  morning: CentroAtencionShift;
  afternoon: CentroAtencionShift;
  night: CentroAtencionShift;
}

export interface CentroAtencionShift {
  startsAt: string; // HH:mm
  endsAt: string; // HH:mm
}

// =============================================================================
// CRUD REQUESTS
// =============================================================================

/**
 * Request para crear un nuevo centro de atencion.
 * POST /api/v1/care-centers
 */
export interface CreateCentroAtencionRequest {
  name: string;
  folioCode: string;
  isExternal: boolean;
  address: string;
  schedule: CentroAtencionSchedule;
}

/**
 * Request para actualizar un centro de atencion existente.
 * PUT /api/v1/care-centers/:id
 */
export interface UpdateCentroAtencionRequest {
  name?: string;
  folioCode?: string;
  isExternal?: boolean;
  isActive?: boolean;
  address?: string;
  schedule?: CentroAtencionSchedule;
}

// =============================================================================
// CRUD RESPONSES
// =============================================================================

/**
 * Response paginada de listado de centros de atencion.
 * GET /api/v1/care-centers
 */
export type CentrosAtencionListResponse = ListResponse<CentroAtencionListItem>;

/**
 * Response con detalle completo de un centro de atencion.
 * GET /api/v1/care-centers/:id
 */
export interface CentroAtencionDetailResponse {
  center: CentroAtencionDetail;
}

/**
 * Response al crear un centro de atencion.
 * POST /api/v1/care-centers
 */
export interface CreateCentroAtencionResponse {
  id: number;
  name: string;
}

/**
 * Response al actualizar un centro de atencion.
 * PUT /api/v1/care-centers/:id
 */
export interface UpdateCentroAtencionResponse {
  center: CentroAtencionDetail;
}

/**
 * Response de eliminacion de centro de atencion.
 * DELETE /api/v1/care-centers/:id
 */
export type DeleteCentroAtencionResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

/**
 * Parametros para listar centros de atencion.
 * GET /api/v1/care-centers
 */
export interface CentrosAtencionListParams extends PaginationParams {
  isActive?: boolean;
  isExternal?: boolean;
}
