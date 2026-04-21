import type { TiposAreasListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "tipos-areas"] as const;

export const tiposAreasKeys = {
  all: BASE_KEY,

  list: (params?: TiposAreasListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
