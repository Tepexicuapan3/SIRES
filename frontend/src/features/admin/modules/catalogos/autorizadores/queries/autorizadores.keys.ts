import type { AutorizadoresListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const autorizadoresKeys = createCatalogKeys<AutorizadoresListParams>([
  "admin",
  "catalogos",
  "autorizadores",
]);
