import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface TipoConsultaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TipoConsultaDetail extends TipoConsultaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTipoConsultaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTipoConsultaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TiposConsultaListResponse = ListResponse<TipoConsultaListItem>;

export interface TipoConsultaDetailResponse {
  consultationType: TipoConsultaDetail;
}

export interface CreateTipoConsultaResponse {
  id: number;
  name: string;
}

export interface UpdateTipoConsultaResponse {
  consultationType: TipoConsultaDetail;
}

export type DeleteTipoConsultaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TiposConsultaListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
