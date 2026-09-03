import { religionesAPI } from "@api/resources/catalogos/religiones.api";
import type { ReligionesListParams, ReligionesListResponse } from "@api/types";
import { religionesKeys } from "@features/admin/modules/catalogos/religiones/queries/religiones.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useReligionesList = createCatalogListHook<
  ReligionesListParams,
  ReligionesListResponse
>({
  keys: religionesKeys,
  getAll: religionesAPI.getAll,
});
