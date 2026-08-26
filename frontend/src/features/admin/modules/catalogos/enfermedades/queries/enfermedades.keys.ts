import type { EnfermedadesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const enfermedadesKeys = createCatalogKeys<EnfermedadesListParams>([
  "admin",
  "catalogos",
  "enfermedades",
]);
