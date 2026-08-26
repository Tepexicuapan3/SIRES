import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface GrupoMedicamentosListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface GrupoMedicamentosDetail extends GrupoMedicamentosListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateGrupoMedicamentosRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateGrupoMedicamentosRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type GruposMedicamentosListResponse = ListResponse<GrupoMedicamentosListItem>;

export interface GrupoMedicamentosDetailResponse {
  medicationGroup: GrupoMedicamentosDetail;
}

export interface CreateGrupoMedicamentosResponse {
  id: number;
  name: string;
}

export interface UpdateGrupoMedicamentosResponse {
  medicationGroup: GrupoMedicamentosDetail;
}

export type DeleteGrupoMedicamentosResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface GruposMedicamentosListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
