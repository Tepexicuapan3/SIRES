import type { EscuelasListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const escuelasKeys = createCatalogKeys<EscuelasListParams>([
  "admin",
  "catalogos",
  "escuelas",
]);
