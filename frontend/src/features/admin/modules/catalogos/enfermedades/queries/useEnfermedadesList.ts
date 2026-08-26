import { enfermedadesAPI } from "@api/resources/catalogos/enfermedades.api";
import type { EnfermedadesListParams, EnfermedadesListResponse } from "@api/types";
import { enfermedadesKeys } from "@features/admin/modules/catalogos/enfermedades/queries/enfermedades.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEnfermedadesList = createCatalogListHook<
  EnfermedadesListParams,
  EnfermedadesListResponse
>({
  keys: enfermedadesKeys,
  getAll: enfermedadesAPI.getAll,
});
