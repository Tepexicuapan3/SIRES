import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface OrigenConsultaListItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface OrigenConsultaDetail extends OrigenConsultaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateOrigenConsultaRequest {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateOrigenConsultaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type OrigenConsultaListResponse = ListResponse<OrigenConsultaListItem>;

export interface OrigenConsultaDetailResponse {
  consultationOrigin: OrigenConsultaDetail;
}

export interface CreateOrigenConsultaResponse {
  id: string;
  name: string;
}

export interface UpdateOrigenConsultaResponse {
  consultationOrigin: OrigenConsultaDetail;
}

export type DeleteOrigenConsultaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface OrigenConsultaListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
