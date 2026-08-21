import { edoCivilAPI } from "@api/resources/catalogos/edoCivil.api";
import type { EdoCivilListParams, EdoCivilListResponse } from "@api/types";
import { edoCivilKeys } from "@features/admin/modules/catalogos/edo-civil/queries/edoCivil.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEdoCivilList = createCatalogListHook<
  EdoCivilListParams,
  EdoCivilListResponse
>({
  keys: edoCivilKeys,
  getAll: edoCivilAPI.getAll,
});
