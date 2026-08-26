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
  code: string | null;
  studyType: string;
  isActive: boolean;
}

export interface EstudioMedicoDetail extends EstudioMedicoListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
  indication: string;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEstudioMedicoRequest {
  name: string;
  studyType: string;
  indication: string;
  isActive?: boolean;
}

export interface UpdateEstudioMedicoRequest {
  name?: string;
  studyType?: string;
  indication?: string;
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
