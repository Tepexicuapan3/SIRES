import type { EntradasListParams } from "@api/types";

export const entradasKeys = {
  all:    () => ["almacen", "entradas"] as const,
  lists:  () => [...entradasKeys.all(), "list"] as const,
  list:   (p: EntradasListParams) => [...entradasKeys.lists(), p] as const,
  detail: (id: number) => [...entradasKeys.all(), "detail", id] as const,
};
