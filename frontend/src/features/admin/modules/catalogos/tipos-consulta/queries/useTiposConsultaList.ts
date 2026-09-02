import { tiposConsultaAPI } from "@api/resources/catalogos/tipos-consulta.api";
import type { TiposConsultaListParams, TiposConsultaListResponse } from "@api/types";
import { tiposConsultaKeys } from "@features/admin/modules/catalogos/tipos-consulta/queries/tipos-consulta.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTiposConsultaList = createCatalogListHook<
  TiposConsultaListParams,
  TiposConsultaListResponse
>({
  keys: tiposConsultaKeys,
  getAll: tiposConsultaAPI.getAll,
});
