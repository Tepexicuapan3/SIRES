import type { EscuelasListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "escuelas"] as const;

export const escuelasKeys = {
  all: BASE_KEY,

  list: (params?: EscuelasListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
