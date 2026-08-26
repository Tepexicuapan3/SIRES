import type { TiposAutorizacionListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tiposAutorizacionKeys = createCatalogKeys<TiposAutorizacionListParams>([
  "admin",
  "catalogos",
  "tipos-autorizacion",
]);
