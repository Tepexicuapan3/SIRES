import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface OcupacionListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface OcupacionDetail extends OcupacionListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateOcupacionRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateOcupacionRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type OcupacionesListResponse = ListResponse<OcupacionListItem>;

export interface OcupacionDetailResponse {
  occupation: OcupacionDetail;
}

export interface CreateOcupacionResponse {
  id: number;
  name: string;
}

export interface UpdateOcupacionResponse {
  occupation: OcupacionDetail;
}

export type DeleteOcupacionResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface OcupacionesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
