import type { RolesListParams } from "@api/types";

export const rolesKeys = {
  all: ["admin", "rbac", "roles"] as const,
  list: (params?: RolesListParams) =>
    params
      ? ([...rolesKeys.all, "list", params] as const)
      : ([...rolesKeys.all, "list"] as const),
  detail: (id: number) => [...rolesKeys.all, "detail", id] as const,
};
