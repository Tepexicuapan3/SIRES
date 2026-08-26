import type { OrigenConsultaListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const origenConsultaKeys = createCatalogKeys<
  OrigenConsultaListParams,
  string
>(["admin", "catalogos", "origen-consulta"]);
