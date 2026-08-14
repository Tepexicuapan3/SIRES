import { tiposCitasAPI } from "@api/resources/catalogos/tipos-citas.api";
import type { TiposCitasListParams, TiposCitasListResponse } from "@api/types";
import { tiposCitasKeys } from "@features/admin/modules/catalogos/tipos-citas/queries/tipos-citas.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTiposCitasList = createCatalogListHook<
  TiposCitasListParams,
  TiposCitasListResponse
>({
  keys: tiposCitasKeys,
  getAll: tiposCitasAPI.getAll,
});
