/**
 * Enfermedades Types - Pure TypeScript interfaces
 * Catálogo CIE (enfermedades).
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
 * Referencia mínima (para relaciones futuras)
 */
export interface EnfermedadRef {
  id: number;
  name: string;
}

/**
 * Enfermedad para listado en tablas
 * GET /api/v1/catalogos/enfermedades
 */
export interface EnfermedadListItem {
  id: number;
  code: string;
  name: string;
  cieVersion: string;
  isActive: boolean;
}

/**
 * Enfermedad con detalle completo
 * GET /api/v1/catalogos/enfermedades/:id
 */
export interface EnfermedadDetail extends EnfermedadListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// CRUD REQUESTS
// =============================================================================

export interface CreateEnfermedadRequest {
  code: string;
  name: string;
  cieVersion: string;
}

export interface UpdateEnfermedadRequest {
  code?: string;
  name?: string;
  cieVersion?: string;
  isActive?: boolean;
}

// =============================================================================
// CRUD RESPONSES
// =============================================================================

export type EnfermedadesListResponse = ListResponse<EnfermedadListItem>;

export interface EnfermedadDetailResponse {
  enfermedad: EnfermedadDetail;
}

export interface CreateEnfermedadResponse {
  id: number;
  name: string;
}

export interface UpdateEnfermedadResponse {
  enfermedad: EnfermedadDetail;
}

export type DeleteEnfermedadResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EnfermedadesListParams extends PaginationParams {
  isActive?: boolean;
  cieVersion?: string;
}