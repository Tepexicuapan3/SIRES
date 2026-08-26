import type { BajasListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const bajasKeys = createCatalogKeys<BajasListParams>([
  "admin",
  "catalogos",
  "bajas",
]);
