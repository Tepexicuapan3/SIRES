import type { TiposCitasListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "tipos-citas"] as const;

export const tiposCitasKeys = {
  all: BASE_KEY,

  list: (params?: TiposCitasListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
