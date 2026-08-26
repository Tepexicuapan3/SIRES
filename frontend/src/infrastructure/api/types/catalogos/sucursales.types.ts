import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface SucursalListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface SucursalDetail extends SucursalListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// LISTADOS
// =============================================================================

export type SucursalesListResponse = ListResponse<SucursalListItem>;

export interface SucursalesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}

// =============================================================================
// REQUESTS / RESPONSES
// =============================================================================

export interface CreateSucursalRequest {
  name: string;
  isActive?: boolean;
}

export interface CreateSucursalResponse {
  id: number;
  name: string;
  isActive: boolean;
}

export interface UpdateSucursalRequest {
  name?: string;
  isActive?: boolean;
}

export interface SucursalDetailResponse {
  branch: SucursalDetail;
}

export interface UpdateSucursalResponse {
  branch: SucursalDetail;
}

export type DeleteSucursalResponse = SuccessResponse;
