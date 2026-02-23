import type { UsersListParams } from "@api/types";

export const usersKeys = {
  all: ["admin", "rbac", "users"] as const,
  list: (params?: UsersListParams) =>
    params
      ? ([...usersKeys.all, "list", params] as const)
      : ([...usersKeys.all, "list"] as const),
  detail: (id: number) => [...usersKeys.all, "detail", id] as const,
};
