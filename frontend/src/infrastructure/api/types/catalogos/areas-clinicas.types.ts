/**
 * Áreas Clínicas Types
 *
 * cat_areas_clinicas  → /clinical-areas/
 * centro_area_clinica → /care-center-clinical-areas/
 */

import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

// =============================================================================
// REFS
// =============================================================================

export interface AreaClinicaRef {
  id: number;
  name: string;
}

export interface CentroRef {
  id: number;
  name: string;
}

// =============================================================================
// CATÁLOGO cat_areas_clinicas
// =============================================================================

export interface AreaClinicaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface AreaClinicaDetail extends AreaClinicaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface CreateAreaClinicaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateAreaClinicaRequest {
  name?: string;
  isActive?: boolean;
}

export type AreasClinicasListResponse = ListResponse<AreaClinicaListItem>;

export interface AreaClinicaDetailResponse {
  clinicalArea: AreaClinicaDetail;
}

export interface CreateAreaClinicaResponse {
  id: number;
  name: string;
}

export interface UpdateAreaClinicaResponse {
  clinicalArea: AreaClinicaDetail;
}

export type DeleteAreaClinicaResponse = SuccessResponse;

export interface AreasClinicasListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}

// =============================================================================
// RELACIÓN centro_area_clinica
// =============================================================================

export interface CentroAreaClinicaListItem {
  center: CentroRef;
  areaClinica: AreaClinicaRef;
  isActive: boolean;
}

export interface CentroAreaClinicaDetail extends CentroAreaClinicaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface CreateCentroAreaClinicaRequest {
  centerId: number;
  areaClinicaId: number;
  isActive?: boolean;
}

export interface UpdateCentroAreaClinicaRequest {
  isActive?: boolean;
}

export type CentrosAreasClinicasListResponse = ListResponse<CentroAreaClinicaListItem>;

export interface CentroAreaClinicaDetailResponse {
  careCenterClinicalArea: CentroAreaClinicaDetail;
}

export interface CreateCentroAreaClinicaResponse {
  centerId: number;
  areaClinicaId: number;
}

export interface UpdateCentroAreaClinicaResponse {
  careCenterClinicalArea: CentroAreaClinicaDetail;
}

export type DeleteCentroAreaClinicaResponse = SuccessResponse;

export interface CentrosAreasClinicasListParams extends PaginationParams {
  centerId?: number;
  areaClinicaId?: number;
  isActive?: boolean;
}
