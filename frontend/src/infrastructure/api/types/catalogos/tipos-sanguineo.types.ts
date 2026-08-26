import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface TipoSanguineoListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TipoSanguineoDetail extends TipoSanguineoListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTipoSanguineoRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTipoSanguineoRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TiposSanguineoListResponse = ListResponse<TipoSanguineoListItem>;

export interface TipoSanguineoDetailResponse {
  bloodType: TipoSanguineoDetail;
}

export interface CreateTipoSanguineoResponse {
  id: number;
  name: string;
}

export interface UpdateTipoSanguineoResponse {
  bloodType: TipoSanguineoDetail;
}

export type DeleteTipoSanguineoResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TiposSanguineoListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
