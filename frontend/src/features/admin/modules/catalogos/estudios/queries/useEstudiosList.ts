import { estudiosAPI } from "@api/resources/catalogos/estudios.api";
import type { EstudiosListParams, EstudiosListResponse } from "@api/types";
import { estudiosKeys } from "@features/admin/modules/catalogos/estudios/queries/estudios.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEstudiosList = createCatalogListHook<
  EstudiosListParams,
  EstudiosListResponse
>({
  keys: estudiosKeys,
  getAll: estudiosAPI.getAll,
});
