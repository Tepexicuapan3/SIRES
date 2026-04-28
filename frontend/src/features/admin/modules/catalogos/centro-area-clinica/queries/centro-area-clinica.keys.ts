import type { CentrosAreasClinicasListParams } from "@api/types";

const BASE_KEY = ["admin", "catalogos", "centro-area-clinica"] as const;

export const centroAreaClinicaKeys = {
  all: BASE_KEY,

  list: (params?: CentrosAreasClinicasListParams) =>
    params
      ? ([...BASE_KEY, "list", params] as const)
      : ([...BASE_KEY, "list"] as const),

  detail: (centerId: number, areaId: number) =>
    [...BASE_KEY, "detail", centerId, areaId] as const,
};
