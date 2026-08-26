import type { CalidadLaboralListParams } from "@api/types";
import { createCatalogKeys } from "@features/admin/modules/catalogos/shared/queries/createCatalogKeys";

export const calidadLaboralKeys = createCatalogKeys<
  CalidadLaboralListParams,
  string
>(["admin", "catalogos", "calidad-laboral"]);
