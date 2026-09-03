import type { TiposResidenciaListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tiposResidenciaKeys = createCatalogKeys<TiposResidenciaListParams>([
  "admin",
  "catalogos",
  "tipos-residencia",
]);
