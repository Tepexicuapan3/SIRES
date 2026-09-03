import type { ReligionesListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const religionesKeys = createCatalogKeys<ReligionesListParams>([
  "admin",
  "catalogos",
  "religiones",
]);
