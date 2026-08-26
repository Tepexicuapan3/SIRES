import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface TipoAutorizacionListItem {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface TipoAutorizacionDetail extends TipoAutorizacionListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTipoAutorizacionRequest {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateTipoAutorizacionRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TiposAutorizacionListResponse = ListResponse<TipoAutorizacionListItem>;

export interface TipoAutorizacionDetailResponse {
  authorizationType: TipoAutorizacionDetail;
}

export interface CreateTipoAutorizacionResponse {
  id: number;
  name: string;
}

export interface UpdateTipoAutorizacionResponse {
  authorizationType: TipoAutorizacionDetail;
}

export type DeleteTipoAutorizacionResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TiposAutorizacionListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
