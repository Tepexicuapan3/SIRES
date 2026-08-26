import { bajasAPI } from "@api/resources/catalogos/bajas.api";
import type { BajasListParams, BajasListResponse } from "@api/types";
import { bajasKeys } from "@features/admin/modules/catalogos/bajas/queries/bajas.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useBajasList = createCatalogListHook<
  BajasListParams,
  BajasListResponse
>({
  keys: bajasKeys,
  getAll: bajasAPI.getAll,
});
