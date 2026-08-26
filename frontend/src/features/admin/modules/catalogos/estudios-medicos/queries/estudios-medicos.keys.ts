import type { EstudiosMedicosListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const estudiosMedicosKeys = createCatalogKeys<EstudiosMedicosListParams>([
  "admin",
  "catalogos",
  "estudios-medicos",
]);
