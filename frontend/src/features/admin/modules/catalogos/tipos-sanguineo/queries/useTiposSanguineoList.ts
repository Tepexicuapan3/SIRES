import { tiposSanguineoAPI } from "@api/resources/catalogos/tipos-sanguineo.api";
import type { TiposSanguineoListParams, TiposSanguineoListResponse } from "@api/types";
import { tiposSanguineoKeys } from "@features/admin/modules/catalogos/tipos-sanguineo/queries/tipos-sanguineo.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTiposSanguineoList = createCatalogListHook<
  TiposSanguineoListParams,
  TiposSanguineoListResponse
>({
  keys: tiposSanguineoKeys,
  getAll: tiposSanguineoAPI.getAll,
});
