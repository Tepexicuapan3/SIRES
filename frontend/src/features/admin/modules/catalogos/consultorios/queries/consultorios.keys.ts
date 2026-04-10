import type { ConsultoriosListParams } from "@api/types";

export const consultoriosKeys = {
  all: ["admin", "catalogos", "consultorios"] as const,
  list: (params?: ConsultoriosListParams) =>
    params
      ? ([...consultoriosKeys.all, "list", params] as const)
      : ([...consultoriosKeys.all, "list"] as const),
  detail: (id: number) => [...consultoriosKeys.all, "detail", id] as const,
};
