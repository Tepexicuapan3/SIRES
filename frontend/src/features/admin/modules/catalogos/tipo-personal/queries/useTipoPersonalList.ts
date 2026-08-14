import { tipoPersonalAPI } from "@api/resources/catalogos/tipo-personal.api";
import type { TipoPersonalListParams, TipoPersonalListResponse } from "@api/types";
import { tipoPersonalKeys } from "@features/admin/modules/catalogos/tipo-personal/queries/tipo-personal.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTipoPersonalList = createCatalogListHook<
  TipoPersonalListParams,
  TipoPersonalListResponse
>({
  keys: tipoPersonalKeys,
  getAll: tipoPersonalAPI.getAll,
});
