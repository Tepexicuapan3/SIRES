import { escuelasAPI } from "@api/resources/catalogos/escuelas.api";
import type { EscuelasListParams, EscuelasListResponse } from "@api/types";
import { escuelasKeys } from "@features/admin/modules/catalogos/escuelas/queries/escuelas.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEscuelasList = createCatalogListHook<
  EscuelasListParams,
  EscuelasListResponse
>({
  keys: escuelasKeys,
  getAll: escuelasAPI.getAll,
});
