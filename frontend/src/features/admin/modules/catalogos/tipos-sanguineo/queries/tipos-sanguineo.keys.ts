import type { TiposSanguineoListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tiposSanguineoKeys = createCatalogKeys<TiposSanguineoListParams>([
  "admin",
  "catalogos",
  "tipos-sanguineo",
]);
