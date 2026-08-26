import type { LicenciasListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const licenciasKeys = createCatalogKeys<LicenciasListParams>([
  "admin",
  "catalogos",
  "licencias",
]);
