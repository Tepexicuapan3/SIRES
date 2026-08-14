import { escolaridadAPI } from "@api/resources/catalogos/escolaridad.api";
import type { EscolaridadListParams, EscolaridadListResponse } from "@api/types";
import { escolaridadKeys } from "@features/admin/modules/catalogos/escolaridad/queries/escolaridad.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEscolaridadList = createCatalogListHook<
  EscolaridadListParams,
  EscolaridadListResponse
>({
  keys: escolaridadKeys,
  getAll: escolaridadAPI.getAll,
});
