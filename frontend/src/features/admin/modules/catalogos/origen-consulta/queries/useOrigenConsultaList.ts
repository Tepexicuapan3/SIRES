import { origenConsultaAPI } from "@api/resources/catalogos/origenConsulta.api";
import type { OrigenConsultaListParams, OrigenConsultaListResponse } from "@api/types";
import { origenConsultaKeys } from "@features/admin/modules/catalogos/origen-consulta/queries/origenConsulta.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useOrigenConsultaList = createCatalogListHook<
  OrigenConsultaListParams,
  OrigenConsultaListResponse
>({
  keys: origenConsultaKeys,
  getAll: origenConsultaAPI.getAll,
});
