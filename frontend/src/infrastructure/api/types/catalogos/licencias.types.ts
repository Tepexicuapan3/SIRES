import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface LicenciaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface LicenciaDetail extends LicenciaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateLicenciaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateLicenciaRequest {
  name?: string;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type LicenciasListResponse = ListResponse<LicenciaListItem>;

export interface LicenciaDetailResponse {
  license: LicenciaDetail;
}

export interface CreateLicenciaResponse {
  id: number;
  name: string;
}

export interface UpdateLicenciaResponse {
  license: LicenciaDetail;
}

export type DeleteLicenciaResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface LicenciasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
