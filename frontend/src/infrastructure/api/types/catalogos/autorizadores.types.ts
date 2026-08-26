import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";

// =============================================================================
// ENTIDADES
// =============================================================================

export interface AutorizadorListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface AutorizadorDetail extends AutorizadorListItem {
  createdAt: string;
  createdBy: { id: number; name: string } | null;
  updatedAt: string | null;
  updatedBy: { id: number; name: string } | null;
  position: string;
  center: { id: number; name: string } | null;
  authorizationType: { id: number; name: string } | null;
  signatureImage: string | null;
  user: { id: number; name: string } | null;
  fileNumber: string | null;
}

// =============================================================================
// REQUESTS
// =============================================================================

export interface CreateAutorizadorRequest {
  name: string;
  position: string;
  centerId: number;
  authorizationTypeId: number;
  signatureImage?: string | null;
  authorizerPassword: string;
  userId: number;
  fileNumber?: string | null;
  isActive?: boolean;
}

export interface UpdateAutorizadorRequest {
  name?: string;
  position?: string;
  centerId?: number;
  authorizationTypeId?: number;
  signatureImage?: string | null;
  authorizerPassword?: string;
  userId?: number;
  fileNumber?: string | null;
  isActive?: boolean;
}

// =============================================================================
// RESPONSES
// =============================================================================

export type AutorizadoresListResponse = ListResponse<AutorizadorListItem>;

export interface AutorizadorDetailResponse {
  authorizer: AutorizadorDetail;
}

export interface CreateAutorizadorResponse {
  id: number;
  name: string;
}

export interface UpdateAutorizadorResponse {
  authorizer: AutorizadorDetail;
}

export type DeleteAutorizadorResponse = SuccessResponse;

// =============================================================================
// PARAMS
// =============================================================================

export interface AutorizadoresListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}
