import { parentescoAPI } from "@api/resources/catalogos/parentesco.api";
import type { ParentescoListParams, ParentescoListResponse } from "@api/types";
import { parentescoKeys } from "@features/admin/modules/catalogos/parentescos/queries/parentesco.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useParentescoList = createCatalogListHook<
  ParentescoListParams,
  ParentescoListResponse
>({
  keys: parentescoKeys,
  getAll: parentescoAPI.getAll,
});
