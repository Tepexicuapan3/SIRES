import { turnosAPI } from "@api/resources/catalogos/turnos.api";
import type { TurnosListParams, TurnosListResponse } from "@api/types";
import { turnosKeys } from "@features/admin/modules/catalogos/turnos/queries/turnos.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useTurnosList = createCatalogListHook<
  TurnosListParams,
  TurnosListResponse
>({
  keys: turnosKeys,
  getAll: turnosAPI.getAll,
});
