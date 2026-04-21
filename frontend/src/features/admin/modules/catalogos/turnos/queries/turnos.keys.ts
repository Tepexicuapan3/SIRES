import type { TurnosListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "turnos"] as const;

export const turnosKeys = {
  all: BASE_KEY,

  list: (params?: TurnosListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
