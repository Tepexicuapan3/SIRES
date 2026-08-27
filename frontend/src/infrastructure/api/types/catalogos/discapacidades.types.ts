import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface DiscapacidadListItem {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface DiscapacidadDetail extends DiscapacidadListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateDiscapacidadRequest {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateDiscapacidadRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type DiscapacidadesListResponse = ListResponse<DiscapacidadListItem>;

export interface DiscapacidadDetailResponse {
  disability: DiscapacidadDetail;
}

export interface CreateDiscapacidadResponse {
  id: number;
  name: string;
  code: string;
}

export interface UpdateDiscapacidadResponse {
  disability: DiscapacidadDetail;
}

export type DeleteDiscapacidadResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface DiscapacidadesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "code" | "isActive";
  sortOrder?: "asc" | "desc";
}
