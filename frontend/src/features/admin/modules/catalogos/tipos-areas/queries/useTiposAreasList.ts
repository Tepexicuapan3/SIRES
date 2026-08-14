import { tiposAreasAPI } from "@api/resources/catalogos/tipos-areas.api";
import type { TiposAreasListParams, TiposAreasListResponse } from "@api/types";
import { tiposAreasKeys } from "@features/admin/modules/catalogos/tipos-areas/queries/tipos-areas.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTiposAreasList = createCatalogListHook<
  TiposAreasListParams,
  TiposAreasListResponse
>({
  keys: tiposAreasKeys,
  getAll: tiposAreasAPI.getAll,
});
