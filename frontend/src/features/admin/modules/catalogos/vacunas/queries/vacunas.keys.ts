import type { VacunasListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "vacunas"] as const;

export const vacunasKeys = {
  all: BASE_KEY,

  list: (params?: VacunasListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
