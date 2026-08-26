import { autorizadoresAPI } from "@api/resources/catalogos/autorizadores.api";
import type { AutorizadoresListParams, AutorizadoresListResponse } from "@api/types";
import { autorizadoresKeys } from "@features/admin/modules/catalogos/autorizadores/queries/autorizadores.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useAutorizadoresList = createCatalogListHook<
  AutorizadoresListParams,
  AutorizadoresListResponse
>({
  keys: autorizadoresKeys,
  getAll: autorizadoresAPI.getAll,
});
