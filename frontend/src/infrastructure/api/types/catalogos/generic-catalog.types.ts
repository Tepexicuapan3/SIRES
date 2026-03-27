import type { ListResponse, PaginationParams } from "@api/types/common.types";

export interface GenericCatalogListItem {
  id: number | string;
  name: string;
  isActive: boolean;
  code?: string | number | null;
}

export type GenericCatalogListResponse = ListResponse<GenericCatalogListItem>;

export interface GenericCatalogListParams extends PaginationParams {
  isActive?: boolean;
}
