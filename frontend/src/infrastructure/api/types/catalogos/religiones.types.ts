import type {
  PaginationParams,
  ListResponse,
  SuccessResponse,
} from "@api/types/common.types";
import type { UserRef } from "@api/types/users.types";

export interface ReligionListItem {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ReligionDetail extends ReligionListItem {
  createdAt: string;
  createdBy: UserRef | null;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

export interface CreateReligionRequest {
  name: string;
  isActive?: boolean;
}

export interface UpdateReligionRequest {
  name?: string;
  isActive?: boolean;
}

export type ReligionesListResponse = ListResponse<ReligionListItem>;

export interface ReligionDetailResponse {
  religion: ReligionDetail;
}

export interface CreateReligionResponse {
  id: number;
  name: string;
}

export interface UpdateReligionResponse {
  religion: ReligionDetail;
}

export type DeleteReligionResponse = SuccessResponse;

export interface ReligionesListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: "asc" | "desc";
}
