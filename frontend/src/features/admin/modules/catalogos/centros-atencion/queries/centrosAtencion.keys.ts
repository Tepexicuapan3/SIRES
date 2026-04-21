import type {
  CentrosAtencionListParams,
  CentrosAtencionHorariosListParams,
  CentrosAtencionExcepcionesListParams,
} from "@api/types";

const BASE_KEY = ["admin", "catalogos", "centros-atencion"] as const;

export const centrosAtencionKeys = {
  all: BASE_KEY,

  list: (params?: CentrosAtencionListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (id: number) => [...BASE_KEY, "detail", id] as const,

  schedules: {
    all: [...BASE_KEY, "schedules"] as const,
    list: (params?: CentrosAtencionHorariosListParams) =>
      params
        ? ([...BASE_KEY, "schedules", "list", params] as const)
        : ([...BASE_KEY, "schedules", "list"] as const),
    detail: (id: number) => [...BASE_KEY, "schedules", "detail", id] as const,
  },

  exceptions: {
    all: [...BASE_KEY, "exceptions"] as const,
    list: (params?: CentrosAtencionExcepcionesListParams) =>
      params
        ? ([...BASE_KEY, "exceptions", "list", params] as const)
        : ([...BASE_KEY, "exceptions", "list"] as const),
    detail: (id: number) => [...BASE_KEY, "exceptions", "detail", id] as const,
  },
};
