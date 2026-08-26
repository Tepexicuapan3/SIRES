import { licenciasAPI } from "@api/resources/catalogos/licencias.api";
import type { LicenciasListParams, LicenciasListResponse } from "@api/types";
import { licenciasKeys } from "@features/admin/modules/catalogos/licencias/queries/licencias.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useLicenciasList = createCatalogListHook<
  LicenciasListParams,
  LicenciasListResponse
>({
  keys: licenciasKeys,
  getAll: licenciasAPI.getAll,
});
