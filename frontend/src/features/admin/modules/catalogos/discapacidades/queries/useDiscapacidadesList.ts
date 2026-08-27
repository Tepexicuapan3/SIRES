import { discapacidadesAPI } from "@api/resources/catalogos/discapacidades.api";
import type { DiscapacidadesListParams, DiscapacidadesListResponse } from "@api/types";
import { discapacidadesKeys } from "@features/admin/modules/catalogos/discapacidades/queries/discapacidades.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useDiscapacidadesList = createCatalogListHook<
  DiscapacidadesListParams,
  DiscapacidadesListResponse
>({
  keys: discapacidadesKeys,
  getAll: discapacidadesAPI.getAll,
});
