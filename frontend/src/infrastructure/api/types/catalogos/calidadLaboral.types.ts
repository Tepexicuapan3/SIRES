import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface CalidadLaboralListItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CalidadLaboralDetail extends CalidadLaboralListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateCalidadLaboralRequest {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateCalidadLaboralRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type CalidadLaboralListResponse = ListResponse<CalidadLaboralListItem>;

export interface CalidadLaboralDetailResponse {
  laborQuality: CalidadLaboralDetail;
}

export interface CreateCalidadLaboralResponse {
  id: string;
  name: string;
}

export interface UpdateCalidadLaboralResponse {
  laborQuality: CalidadLaboralDetail;
}

export type DeleteCalidadLaboralResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface CalidadLaboralListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
