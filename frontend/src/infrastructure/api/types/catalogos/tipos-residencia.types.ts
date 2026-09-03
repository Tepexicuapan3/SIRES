import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

export interface TipoResidenciaListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TipoResidenciaDetail extends TipoResidenciaListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface CreateTipoResidenciaRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateTipoResidenciaRequest {
  name?: string;
  isActive?: boolean;
}

export type TiposResidenciaListResponse = ListResponse<TipoResidenciaListItem>;

export interface TipoResidenciaDetailResponse {
  residenceType: TipoResidenciaDetail;
}

export interface CreateTipoResidenciaResponse {
  id: number;
  name: string;
}

export interface UpdateTipoResidenciaResponse {
  residenceType: TipoResidenciaDetail;
}

export type DeleteTipoResidenciaResponse = SuccessResponse;

export interface TiposResidenciaListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
