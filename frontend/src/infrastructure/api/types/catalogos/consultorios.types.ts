import type {
  ListResponse,
  PaginationParams,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

export interface ConsultorioRef {
  id: number;
  name: string;
}

export interface ConsultorioCatalogRef {
  id: number;
  name: string;
}

export interface ConsultorioListItem {
  id: number;
  name: string;
  code: number;
  isActive: boolean;
}

export interface ConsultorioDetail extends ConsultorioListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
  turn: ConsultorioCatalogRef | null;
  center: ConsultorioCatalogRef | null;
}

export interface CreateConsultorioRequest {
  name: string;
  code: number;
  idTurn: number;
  idCenter: number;
  isActive?: boolean;
}

export interface UpdateConsultorioRequest {
  name?: string;
  code?: number;
  idTurn?: number;
  idCenter?: number;
  isActive?: boolean;
}

export type ConsultoriosListResponse = ListResponse<ConsultorioListItem>;

export interface ConsultorioDetailResponse {
  consultingRoom: ConsultorioDetail;
}

export interface CreateConsultorioResponse {
  id: number;
  name: string;
}

export interface UpdateConsultorioResponse {
  consultingRoom: ConsultorioDetail;
}

export type DeleteConsultorioResponse = SuccessResponse;

export interface ConsultoriosListParams extends PaginationParams {
  isActive?: boolean;
  search?: string;
}
