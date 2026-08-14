import type { EspecialidadesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const especialidadesKeys = createCatalogKeys<EspecialidadesListParams>([
  "admin",
  "catalogos",
  "especialidades",
]);
