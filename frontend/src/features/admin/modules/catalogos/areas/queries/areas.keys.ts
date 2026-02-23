import type { AreasListParams } from "@api/types";

export const areasKeys = {
  all: ["admin", "catalogos", "areas"] as const,
  list: (params?: AreasListParams) =>
    params
      ? ([...areasKeys.all, "list", params] as const)
      : ([...areasKeys.all, "list"] as const),
  detail: (id: number) => [...areasKeys.all, "detail", id] as const,
};
