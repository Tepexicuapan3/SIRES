import type { TiposConsultaListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tiposConsultaKeys = createCatalogKeys<TiposConsultaListParams>([
  "admin",
  "catalogos",
  "tipos-consulta",
]);
