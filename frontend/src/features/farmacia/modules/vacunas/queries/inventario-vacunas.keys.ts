import type { InventarioVacunaListParams } from "@api/types";

const BASE_KEY = ["farmacia", "inventario-vacunas"] as const;

export const inventarioVacunasKeys = {
  all: BASE_KEY,
  lists: () => [...BASE_KEY, "list"] as const,
  list: (params: InventarioVacunaListParams) => [...BASE_KEY, "list", params] as const,
  details: () => [...BASE_KEY, "detail"] as const,
  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
