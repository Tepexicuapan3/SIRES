import type { SucursalesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const sucursalesKeys = createCatalogKeys<SucursalesListParams>([
  "admin",
  "catalogos",
  "sucursales",
]);
