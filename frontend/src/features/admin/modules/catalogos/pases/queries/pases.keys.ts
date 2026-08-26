import type { PasesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const pasesKeys = createCatalogKeys<PasesListParams>([
  "admin",
  "catalogos",
  "pases",
]);
