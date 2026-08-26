import { ocupacionesAPI } from "@api/resources/catalogos/ocupaciones.api";
import type { OcupacionesListParams, OcupacionesListResponse } from "@api/types";
import { ocupacionesKeys } from "@features/admin/modules/catalogos/ocupaciones/queries/ocupaciones.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useOcupacionesList = createCatalogListHook<
  OcupacionesListParams,
  OcupacionesListResponse
>({
  keys: ocupacionesKeys,
  getAll: ocupacionesAPI.getAll,
});
