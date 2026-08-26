import type { EstudiosListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const estudiosKeys = createCatalogKeys<EstudiosListParams>([
  "admin",
  "catalogos",
  "estudios",
]);
