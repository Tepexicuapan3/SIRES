import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EnfermedadListItem {
  id: number;
  name: string;
  code: string;
  cieVersion: string;
  isActive: boolean;
}

export interface EnfermedadDetail extends EnfermedadListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEnfermedadRequest {
  name: string;
  code: string;
  cieVersion: string;
  isActive?: boolean;
}

export interface UpdateEnfermedadRequest {
  name?: string;
  code?: string;
  cieVersion?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EnfermedadesListResponse = ListResponse<EnfermedadListItem>;

export interface EnfermedadDetailResponse {
  disease: EnfermedadDetail;
}

export interface CreateEnfermedadResponse {
  id: number;
  name: string;
}

export interface UpdateEnfermedadResponse {
  disease: EnfermedadDetail;
}

export type DeleteEnfermedadResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EnfermedadesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
