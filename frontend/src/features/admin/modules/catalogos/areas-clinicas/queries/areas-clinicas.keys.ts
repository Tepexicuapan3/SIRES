import type { AreasClinicasListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "areas-clinicas"] as const;

export const areasClinicasKeys = {
  all: BASE_KEY,

  list: (params?: AreasClinicasListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,
};
