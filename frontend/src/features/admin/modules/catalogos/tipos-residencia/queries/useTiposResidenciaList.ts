import { tiposResidenciaAPI } from "@api/resources/catalogos/tipos-residencia.api";
import type { TiposResidenciaListParams, TiposResidenciaListResponse } from "@api/types";
import { tiposResidenciaKeys } from "@features/admin/modules/catalogos/tipos-residencia/queries/tipos-residencia.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTiposResidenciaList = createCatalogListHook<
  TiposResidenciaListParams,
  TiposResidenciaListResponse
>({
  keys: tiposResidenciaKeys,
  getAll: tiposResidenciaAPI.getAll,
});
