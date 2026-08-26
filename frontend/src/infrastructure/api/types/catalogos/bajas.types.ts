import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface BajaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface BajaDetail extends BajaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateBajaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateBajaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type BajasListResponse = ListResponse<BajaListItem>;

export interface BajaDetailResponse {
  dischargeReason: BajaDetail;
}

export interface CreateBajaResponse {
  id: number;
  name: string;
}

export interface UpdateBajaResponse {
  dischargeReason: BajaDetail;
}

export type DeleteBajaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface BajasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
