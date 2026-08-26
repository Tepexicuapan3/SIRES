import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface PaseListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface PaseDetail extends PaseListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreatePaseRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdatePaseRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type PasesListResponse = ListResponse<PaseListItem>;

export interface PaseDetailResponse {
  pass: PaseDetail;
}

export interface CreatePaseResponse {
  id: number;
  name: string;
}

export interface UpdatePaseResponse {
  pass: PaseDetail;
}

export type DeletePaseResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface PasesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
