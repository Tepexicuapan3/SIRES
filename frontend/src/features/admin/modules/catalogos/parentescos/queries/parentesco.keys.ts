import type { ParentescoListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const parentescoKeys = createCatalogKeys<
  ParentescoListParams,
  string
>(["admin", "catalogos", "parentescos"]);
