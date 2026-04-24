/**
 * Vacunas Types - Pure TypeScript interfaces
 *
 * Contrato alineado al backend actual:
 * - GET    /vaccines/
 * - POST   /vaccines/
 * - GET    /vaccines/:id
 * - PUT    /vaccines/:id
 * - DELETE /vaccines/:id
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

export interface VacunaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface VacunaDetail extends VacunaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateVacunaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateVacunaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type VacunasListResponse = ListResponse<VacunaListItem>;

export interface VacunaDetailResponse {
  vaccine: VacunaDetail;
}

export interface CreateVacunaResponse {
  id: number;
  name: string;
}

export interface UpdateVacunaResponse {
  vaccine: VacunaDetail;
}

export type DeleteVacunaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface VacunasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
