import type { ListResponse, PaginationParams, SuccessResponse } from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// REFS
// =============================================================================

export interface VacunaRef {
  id: number;
  name: string;
}

export interface CentroRef {
  id: number;
  name: string;
}

// =============================================================================
// ENTIDADES
// =============================================================================

export interface InventarioVacunaListItem {
  id: number;
  vaccine: VacunaRef;
  center: CentroRef;
  stockQuantity: number;
  appliedDoses: number;
  availableDoses: number;
  isActive: boolean;
}

export interface InventarioVacunaDetail extends InventarioVacunaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateInventarioVacunaRequest {
  vaccineId: number;
  centerId: number;
  stockQuantity: number;
}

export interface UpdateInventarioVacunaRequest {
  stockQuantity?: number;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type InventarioVacunaListResponse = ListResponse<InventarioVacunaListItem>;

export interface InventarioVacunaDetailResponse {
  inventario: InventarioVacunaDetail;
}

export interface CreateInventarioVacunaResponse {
  id: number;
  vaccine: string;
  center: string;
}

export interface UpdateInventarioVacunaResponse {
  inventario: InventarioVacunaDetail;
}

export type DeleteInventarioVacunaResponse = SuccessResponse;

export interface ApplyDosesRequest {
  doses: number;
}

export interface ApplyDosesResponse {
  inventario: InventarioVacunaDetail;
  dosesApplied: number;
}

// =============================================================================
// PARAMS
// =============================================================================

export interface InventarioVacunaListParams extends PaginationParams {
  search?: string;
  vaccineId?: number;
  centerId?: number;
  isActive?: boolean;
  sortBy?: "vaccine" | "center" | "stockQuantity" | "appliedDoses" | "isActive";
  sortOrder?: "asc" | "desc";
}
