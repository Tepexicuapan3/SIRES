import type { TipoPersonalListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const tipoPersonalKeys = createCatalogKeys<TipoPersonalListParams>([
  "admin",
  "catalogos",
  "tipo-personal",
]);
