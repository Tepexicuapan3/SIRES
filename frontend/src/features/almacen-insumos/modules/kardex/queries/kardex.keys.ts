import type { ExistenciasListParams, KardexListParams } from "@api/types";

export const kardexKeys = {
  all:        () => ["almacen", "kardex"] as const,
  movs:       () => [...kardexKeys.all(), "movimientos"] as const,
  movList:    (p: KardexListParams)       => [...kardexKeys.movs(), p] as const,
  existencias: () => [...kardexKeys.all(), "existencias"] as const,
  existList:  (p: ExistenciasListParams)  => [...kardexKeys.existencias(), p] as const,
};
