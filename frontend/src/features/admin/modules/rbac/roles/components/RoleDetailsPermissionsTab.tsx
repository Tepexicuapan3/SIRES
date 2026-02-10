import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAssignRolePermissions } from "@features/admin/modules/rbac/roles/mutations/useAssignRolePermissions";
import { useRevokeRolePermission } from "@features/admin/modules/rbac/roles/mutations/useRevokeRolePermission";
import { getRoleErrorMessage } from "@features/admin/modules/rbac/roles/utils/roles.feedback";
import { formatDateTime } from "@features/admin/modules/rbac/roles/utils/roles.format";
import { PermissionHierarchyExplorer } from "@features/admin/modules/rbac/shared/components/PermissionHierarchyExplorer";
import type { Permission, RolePermission } from "@api/types";

interface RoleDetailsPermissionsTabProps {
  roleId: number;
  permissions: RolePermission[];
  permissionCatalog: Permission[];
  isLoadingPermissions: boolean;
  isEditable?: boolean;
  catalogErrorMessage?: string | null;
  onRetryCatalog?: () => void;
}

export function RoleDetailsPermissionsTab({
  roleId,
  permissions,
  permissionCatalog,
  isLoadingPermissions,
  isEditable = true,
  catalogErrorMessage = null,
  onRetryCatalog,
}: RoleDetailsPermissionsTabProps) {
  const assignPermissions = useAssignRolePermissions();
  const revokePermission = useRevokeRolePermission();

  const assignedIds = new Set(permissions.map((permission) => permission.id));
  const availablePermissions = permissionCatalog.filter(
    (permission) => !assignedIds.has(permission.id),
  );

  const availableEntries = availablePermissions.map((permission) => ({
    id: permission.id.toString(),
    code: permission.code,
    description: permission.description,
    payload: permission,
  }));

  const assignedEntries = permissions.map((permission) => ({
    id: permission.id.toString(),
    code: permission.code,
    description: permission.description,
    payload: permission,
  }));

  const handleAddPermission = async (permissionId: number) => {
    if (!isEditable || catalogErrorMessage) return;

    const finalPermissionIds = Array.from(
      new Set([
        ...permissions.map((permission) => permission.id),
        permissionId,
      ]),
    );

    try {
      await assignPermissions.mutateAsync({
        data: { roleId, permissionIds: finalPermissionIds },
      });
      toast.success("Permiso agregado", {
        description: "El permiso se agrego correctamente al rol.",
      });
    } catch (error) {
      toast.error("No se pudo agregar", {
        description: getRoleErrorMessage(error, "Error al agregar permiso"),
      });
    }
  };

  const handleRemovePermission = async (permissionId: number) => {
    if (!isEditable) return;

    try {
      await revokePermission.mutateAsync({ roleId, permissionId });
      toast.success("Permiso removido", {
        description: "El permiso se elimino del rol.",
      });
    } catch (error) {
      toast.error("No se pudo remover", {
        description: getRoleErrorMessage(error, "Error al remover permiso"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {catalogErrorMessage ? (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-xs text-status-critical">
          <p>{catalogErrorMessage}</p>
          {onRetryCatalog ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onRetryCatalog}
            >
              Reintentar catalogo
            </Button>
          ) : null}
        </div>
      ) : null}

      <PermissionHierarchyExplorer
        title="Catalogo de permisos"
        description="Busca y agrega permisos organizados por Grupo -> Modulo -> Submodulo -> Accion."
        entries={availableEntries}
        isLoading={isLoadingPermissions}
        emptyMessage="No hay permisos disponibles para agregar."
        actionLabel="Agregar"
        actionIcon={<Plus className="size-4" />}
        actionVariant="outline"
        isActionPending={assignPermissions.isPending}
        isActionDisabled={() => !isEditable || Boolean(catalogErrorMessage)}
        onAction={(item) => {
          void handleAddPermission(item.payload.id);
        }}
        actionAriaLabel={(item) => `Agregar permiso ${item.code}`}
      />

      <PermissionHierarchyExplorer
        title="Permisos asignados al rol"
        description="Visualiza y gestiona los permisos activos del rol de forma jerarquica."
        entries={assignedEntries}
        emptyMessage="Este rol no tiene permisos asignados."
        actionDisplay="icon"
        actionIcon={<X className="size-4" />}
        actionVariant="ghost"
        isActionPending={revokePermission.isPending}
        isActionDisabled={() => !isEditable}
        onAction={(item) => {
          void handleRemovePermission(item.payload.id);
        }}
        actionAriaLabel={(item) => `Remover permiso ${item.code}`}
        renderMeta={(item) => (
          <p className="text-[11px] text-txt-muted">
            Asignado {formatDateTime(item.payload.assignedAt)} por{" "}
            {item.payload.assignedBy?.name ?? "-"}
          </p>
        )}
      />
    </div>
  );
}
