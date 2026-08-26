import { tiposAutorizacionAPI } from "@api/resources/catalogos/tipos-autorizacion.api";
import type { TiposAutorizacionListParams, TiposAutorizacionListResponse } from "@api/types";
import { tiposAutorizacionKeys } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/tipos-autorizacion.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTiposAutorizacionList = createCatalogListHook<
  TiposAutorizacionListParams,
  TiposAutorizacionListResponse
>({
  keys: tiposAutorizacionKeys,
  getAll: tiposAutorizacionAPI.getAll,
});
