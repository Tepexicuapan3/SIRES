import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EspecialidadListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface EspecialidadDetail extends EspecialidadListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEspecialidadRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateEspecialidadRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EspecialidadesListResponse = ListResponse<EspecialidadListItem>;

export interface EspecialidadDetailResponse {
  specialty: EspecialidadDetail;
}

export interface CreateEspecialidadResponse {
  id: number;
  name: string;
}

export interface UpdateEspecialidadResponse {
  specialty: EspecialidadDetail;
}

export type DeleteEspecialidadResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EspecialidadesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
