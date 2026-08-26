import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface ParentescoListItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ParentescoDetail extends ParentescoListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateParentescoRequest {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateParentescoRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type ParentescoListResponse = ListResponse<ParentescoListItem>;

export interface ParentescoDetailResponse {
  kinship: ParentescoDetail;
}

export interface CreateParentescoResponse {
  id: string;
  name: string;
}

export interface UpdateParentescoResponse {
  kinship: ParentescoDetail;
}

export type DeleteParentescoResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface ParentescoListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
