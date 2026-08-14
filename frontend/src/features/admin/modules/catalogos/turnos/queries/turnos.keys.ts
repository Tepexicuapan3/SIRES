import type { TurnosListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const turnosKeys = createCatalogKeys<TurnosListParams>([
  "admin",
  "catalogos",
  "turnos",
]);
