import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EscuelaListItem {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface EscuelaDetail extends EscuelaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEscuelaRequest {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateEscuelaRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EscuelasListResponse = ListResponse<EscuelaListItem>;

export interface EscuelaDetailResponse {
  school: EscuelaDetail;
}

export interface CreateEscuelaResponse {
  id: number;
  name: string;
  code: string;
}

export interface UpdateEscuelaResponse {
  school: EscuelaDetail;
}

export type DeleteEscuelaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EscuelasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "code" | "isActive";
  sortOrder?: "asc" | "desc";
}
