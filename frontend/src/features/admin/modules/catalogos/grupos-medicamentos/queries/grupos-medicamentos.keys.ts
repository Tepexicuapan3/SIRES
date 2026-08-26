import type { GruposMedicamentosListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const gruposMedicamentosKeys = createCatalogKeys<GruposMedicamentosListParams>([
  "admin",
  "catalogos",
  "grupos-medicamentos",
]);
