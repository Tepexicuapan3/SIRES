import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface EstudioListItem {
  id: number;
  name: string;
  precio: number | null;
  studyType: string;
  isActive: boolean;
}

export interface EstudioDetail extends EstudioListItem {
  indication: string | null;
  isGeneral: boolean;
  isAuthorized: boolean;
  groupType: string | null;
  providerId: number | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateEstudioRequest {
  name: string;
  studyType: string;
  precio?: number | null;
  indication?: string | null;
  isGeneral?: boolean;
  isAuthorized?: boolean;
  isActive?: boolean;
  groupType?: string | null;
  providerId?: number | null;
}

export interface UpdateEstudioRequest {
  name?: string;
  studyType?: string;
  precio?: number | null;
  indication?: string | null;
  isGeneral?: boolean;
  isAuthorized?: boolean;
  isActive?: boolean;
  groupType?: string | null;
  providerId?: number | null;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type EstudiosListResponse = ListResponse<EstudioListItem>;

export interface EstudioDetailResponse {
  estudio: EstudioDetail;
}

export interface CreateEstudioResponse {
  id: number;
  name: string;
}

export interface UpdateEstudioResponse {
  estudio: EstudioDetail;
}

export type DeleteEstudioResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface EstudiosListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}
