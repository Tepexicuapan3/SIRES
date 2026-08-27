import type { DiscapacidadesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const discapacidadesKeys = createCatalogKeys<DiscapacidadesListParams>([
  "admin",
  "catalogos",
  "discapacidades",
]);
