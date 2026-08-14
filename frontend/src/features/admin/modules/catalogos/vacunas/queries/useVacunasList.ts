import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import type { VacunasListParams, VacunasListResponse } from "@api/types";
import { vacunasKeys } from "@features/admin/modules/catalogos/vacunas/queries/vacunas.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useVacunasList = createCatalogListHook<
  VacunasListParams,
  VacunasListResponse
>({
  keys: vacunasKeys,
  getAll: vacunasAPI.getAll,
});
