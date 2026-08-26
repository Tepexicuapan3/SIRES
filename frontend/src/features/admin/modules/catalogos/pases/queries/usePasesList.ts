import { pasesAPI } from "@api/resources/catalogos/pases.api";
import type { PasesListParams, PasesListResponse } from "@api/types";
import { pasesKeys } from "@features/admin/modules/catalogos/pases/queries/pases.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const usePasesList = createCatalogListHook<
  PasesListParams,
  PasesListResponse
>({
  keys: pasesKeys,
  getAll: pasesAPI.getAll,
});
