import { sucursalesAPI } from "@api/resources/catalogos/sucursales.api";
import type { SucursalesListParams, SucursalesListResponse } from "@api/types";
import { sucursalesKeys } from "@features/admin/modules/catalogos/sucursales/queries/sucursales.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useSucursalesList = createCatalogListHook<
  SucursalesListParams,
  SucursalesListResponse
>({
  keys: sucursalesKeys,
  getAll: sucursalesAPI.getAll,
});
