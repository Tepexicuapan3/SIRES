import type { TiposCitasListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tiposCitasKeys = createCatalogKeys<TiposCitasListParams>([
  "admin",
  "catalogos",
  "tipos-citas",
]);
