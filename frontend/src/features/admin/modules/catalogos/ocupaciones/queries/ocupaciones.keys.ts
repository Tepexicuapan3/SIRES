import type { OcupacionesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const ocupacionesKeys = createCatalogKeys<OcupacionesListParams>([
  "admin",
  "catalogos",
  "ocupaciones",
]);
