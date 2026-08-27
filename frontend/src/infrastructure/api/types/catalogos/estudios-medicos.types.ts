import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EstudioMedicoListItem {
  id: number;
  name: string;
  precio: string | null;
  studyType: string;
  indication: string;
  isGeneral: boolean;
  isAuthorized: boolean;
  groupType: number | null;
  providerId: number | null;
  isActive: boolean;
}

export interface EstudioMedicoDetail extends EstudioMedicoListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEstudioMedicoRequest {
  name: string;
  studyType: string;
  indication: string;
  precio?: string | null;
  isGeneral?: boolean;
  isAuthorized?: boolean;
  groupType?: number | null;
  providerId?: number | null;
  isActive?: boolean;
}

export interface UpdateEstudioMedicoRequest {
  name?: string;
  studyType?: string;
  indication?: string;
  precio?: string | null;
  isGeneral?: boolean;
  isAuthorized?: boolean;
  groupType?: number | null;
  providerId?: number | null;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EstudiosMedicosListResponse = ListResponse<EstudioMedicoListItem>;

export interface EstudioMedicoDetailResponse {
  medicalStudy: EstudioMedicoDetail;
}

export interface CreateEstudioMedicoResponse {
  id: number;
  name: string;
}

export interface UpdateEstudioMedicoResponse {
  medicalStudy: EstudioMedicoDetail;
}

export type DeleteEstudioMedicoResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EstudiosMedicosListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}
