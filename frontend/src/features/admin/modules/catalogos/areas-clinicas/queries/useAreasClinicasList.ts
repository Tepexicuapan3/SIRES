import { areasClinicasAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { AreasClinicasListParams, AreasClinicasListResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";
import { createCatalogListHook } from "@features/admin/modules/catalogos/shared/queries/createCatalogListHook";

// areasClinicasKeys no se migro a createCatalogKeys: tiene un metodo extra
// (centroAreasClinicas) que el factory generico no cubre. Solo el hook se
// simplifica aca -- sigue usando la .list() que ya expone.
export const useAreasClinicasList = createCatalogListHook<
  AreasClinicasListParams,
  AreasClinicasListResponse
>({
  keys: areasClinicasKeys,
  getAll: areasClinicasAPI.getAll,
});
