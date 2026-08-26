import { calidadLaboralAPI } from "@api/resources/catalogos/calidadLaboral.api";
import type { CalidadLaboralListParams, CalidadLaboralListResponse } from "@api/types";
import { calidadLaboralKeys } from "@features/admin/modules/catalogos/calidad-laboral/queries/calidadLaboral.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useCalidadLaboralList = createCatalogListHook<
  CalidadLaboralListParams,
  CalidadLaboralListResponse
>({
  keys: calidadLaboralKeys,
  getAll: calidadLaboralAPI.getAll,
});
