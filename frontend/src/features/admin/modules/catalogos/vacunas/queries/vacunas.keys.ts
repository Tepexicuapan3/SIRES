import type { VacunasListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const vacunasKeys = createCatalogKeys<VacunasListParams>([
  "admin",
  "catalogos",
  "vacunas",
]);
