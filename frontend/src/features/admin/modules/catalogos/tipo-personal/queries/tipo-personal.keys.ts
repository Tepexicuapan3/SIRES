import type { TipoPersonalListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "tipo-personal"] as const;

export const tipoPersonalKeys = {
  all: BASE_KEY,

  list: (params?: TipoPersonalListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
