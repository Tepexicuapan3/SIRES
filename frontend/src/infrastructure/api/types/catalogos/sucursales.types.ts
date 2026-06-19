import type { PaginationParams, ListResponse } from "@api/types/common.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface SucursalListItem {
  id: number;
  name: string;
  isActive: boolean;
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
