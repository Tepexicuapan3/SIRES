/**
 * Clinics Types - Pure TypeScript interfaces
 * Tipos para gestión completa de clínicas del Metro CDMX.
 *
 * @description Interfaces para CRUD de clínicas.
 * Todos los campos usan camelCase en inglés según el estándar de la API.
 *
 * Estrategia de entidades:
 * - ClinicRef: Referencia mínima para relaciones (ej: User.clinic)
 * - ClinicListItem: Para tablas/listados (sin auditoría)
 * - ClinicDetail: Para detalle/edición (con auditoría completa)
 */

import type { PaginationParams, ListResponse, SuccessResponse } from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

/**
 * Referencia a clínica (objeto anidado para relaciones).
 * Evita tener campos separados clinicId + clinicName.
 * Usado en relaciones con usuarios y otros recursos.
 */
export interface ClinicRef {
  id: number;
  name: string;
}

/**
 * Clínica para listado en tabla.
 * Incluye solo datos necesarios para identificar, filtrar y mostrar en tabla.
 * NO incluye campos de auditoría (optimizado para tablas).
 *
 * GET /api/v1/clinics
 */
export interface ClinicListItem {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

/**
 * Clínica con detalle completo para edición.
 * Extiende ClinicListItem con campos de auditoría.
 *
 * GET /api/v1/clinics/:id
 */
export interface ClinicDetail extends ClinicListItem {
  // --- Auditoría de registro ---
  createdAt: string;
  createdBy: UserRef;
  updatedAt: string | null;
  updatedBy: UserRef | null;
  
  // --- Horarios (estructura pendiente de definir) ---
  /**
   * Horarios de operación de la clínica.
   * Estructura a definir según requerimientos de negocio.
   * Por ahora se deja como genérico para implementación futura.
   */
  schedule?: unknown;
}

// =============================================================================
// CRUD REQUESTS
// =============================================================================

/**
 * Request para crear una nueva clínica.
 * POST /api/v1/clinics
 */
export interface CreateClinicRequest {
  name: string;
  code: string;
}

/**
 * Request para actualizar una clínica existente.
 * PUT /api/v1/clinics/:id
 */
export interface UpdateClinicRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// =============================================================================
// CRUD RESPONSES
// =============================================================================

/**
 * Response paginada de listado de clínicas.
 * GET /api/v1/clinics
 */
export type ClinicsListResponse = ListResponse<ClinicListItem>;

/**
 * Response con detalle completo de una clínica.
 * GET /api/v1/clinics/:id
 */
export interface ClinicDetailResponse {
  clinic: ClinicDetail;
}

/**
 * Response al crear una clínica.
 * POST /api/v1/clinics
 */
export interface CreateClinicResponse {
  id: number;
  name: string;
}

/**
 * Response al actualizar una clínica.
 * PUT /api/v1/clinics/:id
 */
export interface UpdateClinicResponse {
  clinic: ClinicDetail;
}

/**
 * Response de eliminación de clínica.
 * DELETE /api/v1/clinics/:id
 */
export type DeleteClinicResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

/**
 * Parámetros para listar clínicas.
 * GET /api/v1/clinics
 */
export interface ClinicsListParams extends PaginationParams {
  isActive?: boolean;
}
