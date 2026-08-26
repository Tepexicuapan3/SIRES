import { gruposMedicamentosAPI } from "@api/resources/catalogos/grupos-medicamentos.api";
import type { GruposMedicamentosListParams, GruposMedicamentosListResponse } from "@api/types";
import { gruposMedicamentosKeys } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/grupos-medicamentos.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useGruposMedicamentosList = createCatalogListHook<
  GruposMedicamentosListParams,
  GruposMedicamentosListResponse
>({
  keys: gruposMedicamentosKeys,
  getAll: gruposMedicamentosAPI.getAll,
});
