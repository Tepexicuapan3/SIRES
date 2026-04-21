import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EscolaridadListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface EscolaridadDetail extends EscolaridadListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEscolaridadRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateEscolaridadRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EscolaridadListResponse = ListResponse<EscolaridadListItem>;

export interface EscolaridadDetailResponse {
  educationLevel: EscolaridadDetail;
}

export interface CreateEscolaridadResponse {
  id: number;
  name: string;
}

export interface UpdateEscolaridadResponse {
  educationLevel: EscolaridadDetail;
}

export type DeleteEscolaridadResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EscolaridadListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
