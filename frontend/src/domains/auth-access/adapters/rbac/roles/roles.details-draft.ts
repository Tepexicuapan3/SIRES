import type { Permission, RolePermission } from "@api/types";
import type { RoleDetailsFormValues } from "@/domains/auth-access/types/rbac/roles.schemas";

interface RoleDetailFormSource {
  name?: string | null;
  description?: string | null;
  landingRoute?: string | null;
}

export const mapRoleDetailToFormValues = (
  detail?: RoleDetailFormSource | null,
): RoleDetailsFormValues => ({
  name: detail?.name ?? "",
  description: detail?.description ?? "",
  landingRoute: detail?.landingRoute ?? "",
});

export const arePermissionSetsDifferent = (
  sourcePermissions: RolePermission[],
  draftPermissions: RolePermission[],
) => {
  const sourceIds = new Set(sourcePermissions.map((item) => item.id));
  const draftIds = new Set(draftPermissions.map((item) => item.id));

  return (
    sourceIds.size !== draftIds.size ||
    [...sourceIds].some((id) => !draftIds.has(id))
  );
};

export const addPermissionToDraft = (
  basePermissions: RolePermission[],
  permissionCatalog: Permission[],
  permissionId: number,
): RolePermission[] => {
  const selectedPermission = permissionCatalog.find(
    (permission) => permission.id === permissionId,
  );

  if (!selectedPermission) return basePermissions;

  if (basePermissions.some((permission) => permission.id === permissionId)) {
    return basePermissions;
  }

  return [
    ...basePermissions,
    {
      id: selectedPermission.id,
      code: selectedPermission.code,
      description: selectedPermission.description,
      assignedAt: new Date().toISOString(),
      assignedBy: { id: 0, name: "Pendiente de guardar" },
    },
  ];
};

export const removePermissionFromDraft = (
  basePermissions: RolePermission[],
  permissionId: number,
) => {
  return basePermissions.filter((permission) => permission.id !== permissionId);
};
