import { especialidadesAPI } from "@api/resources/catalogos/especialidades.api";
import type { EspecialidadesListParams, EspecialidadesListResponse } from "@api/types";
import { especialidadesKeys } from "@features/admin/modules/catalogos/especialidades/queries/especialidades.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEspecialidadesList = createCatalogListHook<
  EspecialidadesListParams,
  EspecialidadesListResponse
>({
  keys: especialidadesKeys,
  getAll: especialidadesAPI.getAll,
});
