import type { EscolaridadListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "escolaridad"] as const;

export const escolaridadKeys = {
  all: BASE_KEY,

  list: (params?: EscolaridadListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
