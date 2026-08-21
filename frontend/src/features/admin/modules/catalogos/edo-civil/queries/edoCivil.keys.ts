import type { EdoCivilListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const edoCivilKeys = createCatalogKeys<EdoCivilListParams>([
  "admin",
  "catalogos",
  "edoCivil",
]);
