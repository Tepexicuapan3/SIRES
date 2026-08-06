import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface TipoCitaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TipoCitaDetail extends TipoCitaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateTipoCitaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTipoCitaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type TiposCitasListResponse = ListResponse<TipoCitaListItem>;

export interface TipoCitaDetailResponse {
  appointmentType: TipoCitaDetail;
}

export interface CreateTipoCitaResponse {
  id: number;
  name: string;
}

export interface UpdateTipoCitaResponse {
  appointmentType: TipoCitaDetail;
}

export type DeleteTipoCitaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface TiposCitasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
