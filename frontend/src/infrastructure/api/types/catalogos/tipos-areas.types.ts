import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface TipoAreaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TipoAreaDetail extends TipoAreaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTipoAreaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTipoAreaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TiposAreasListResponse = ListResponse<TipoAreaListItem>;

export interface TipoAreaDetailResponse {
  areaType: TipoAreaDetail;
}

export interface CreateTipoAreaResponse {
  id: number;
  name: string;
}

export interface UpdateTipoAreaResponse {
  areaType: TipoAreaDetail;
}

export type DeleteTipoAreaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TiposAreasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
