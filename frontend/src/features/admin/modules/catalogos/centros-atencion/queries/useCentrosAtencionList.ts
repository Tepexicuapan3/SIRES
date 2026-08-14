import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
import type {
  CentrosAtencionListParams,
  CentrosAtencionListResponse,
} from "@api/types";
import { centrosAtencionKeys } from "@features/admin/modules/catalogos/centros-atencion/queries/centrosAtencion.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

// centrosAtencionKeys no se migro a createCatalogKeys: tiene sub-namespaces
// propios (schedules, exceptions) que el factory generico no cubre. Solo
// el hook se simplifica aca -- sigue usando la .list() que ya expone.
export const useCentrosAtencionList = createCatalogListHook<
  CentrosAtencionListParams,
  CentrosAtencionListResponse
>({
  keys: centrosAtencionKeys,
  getAll: centrosAtencionAPI.getAll,
});
