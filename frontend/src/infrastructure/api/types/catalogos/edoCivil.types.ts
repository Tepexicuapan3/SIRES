import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EdoCivilListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface EdoCivilDetail extends EdoCivilListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEdoCivilRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateEdoCivilRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EdoCivilListResponse = ListResponse<EdoCivilListItem>;

export interface EdoCivilDetailResponse {
  civilStatus: EdoCivilDetail;
}

export interface CreateEdoCivilResponse {
  id: number;
  name: string;
}

export interface UpdateEdoCivilResponse {
  civilStatus: EdoCivilDetail;
}

export type DeleteEdoCivilResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EdoCivilListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
