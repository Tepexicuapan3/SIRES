export const permissionsKeys = {
  all: ["admin", "rbac", "permissions"] as const,
  catalog: () => [...permissionsKeys.all, "catalog"] as const,
};
