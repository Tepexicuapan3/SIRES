import type { SucursalesListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "sucursales"] as const;

export const sucursalesKeys = {
  all: BASE_KEY,

  list: (params?: SucursalesListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),
};
