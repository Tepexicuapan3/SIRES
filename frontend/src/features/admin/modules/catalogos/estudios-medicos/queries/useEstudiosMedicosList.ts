import { estudiosMedicosAPI } from "@api/resources/catalogos/estudios-medicos.api";
import type {
  EstudiosMedicosListParams,
  EstudiosMedicosListResponse,
} from "@api/types";
import { estudiosMedicosKeys } from "@features/admin/modules/catalogos/estudios-medicos/queries/estudios-medicos.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

export const useEstudiosMedicosList = createCatalogListHook<
  EstudiosMedicosListParams,
  EstudiosMedicosListResponse
>({
  keys: estudiosMedicosKeys,
  getAll: estudiosMedicosAPI.getAll,
});
