import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface TipoPersonalListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TipoPersonalDetail extends TipoPersonalListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTipoPersonalRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTipoPersonalRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TipoPersonalListResponse = ListResponse<TipoPersonalListItem>;

export interface TipoPersonalDetailResponse {
  personalType: TipoPersonalDetail;
}

export interface CreateTipoPersonalResponse {
  id: number;
  name: string;
}

export interface UpdateTipoPersonalResponse {
  personalType: TipoPersonalDetail;
}

export type DeleteTipoPersonalResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TipoPersonalListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
