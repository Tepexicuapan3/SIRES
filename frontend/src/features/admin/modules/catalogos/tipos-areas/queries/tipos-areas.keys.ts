import type { TiposAreasListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tiposAreasKeys = createCatalogKeys<TiposAreasListParams>([
  "admin",
  "catalogos",
  "tipos-areas",
]);
