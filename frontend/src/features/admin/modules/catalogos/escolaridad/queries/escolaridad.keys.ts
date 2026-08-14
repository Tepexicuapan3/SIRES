import type { EscolaridadListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const escolaridadKeys = createCatalogKeys<EscolaridadListParams>([
  "admin",
  "catalogos",
  "escolaridad",
]);
