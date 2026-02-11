import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@features/admin/modules/rbac/roles/utils/roles.format";
import { PermissionHierarchyExplorer } from "@features/admin/modules/rbac/shared/components/PermissionHierarchyExplorer";
import type { Permission, RolePermission } from "@api/types";

interface RoleDetailsPermissionsTabProps {
  permissions: RolePermission[];
  permissionCatalog: Permission[];
  isLoadingPermissions: boolean;
  isEditable?: boolean;
  isSaving?: boolean;
  catalogErrorMessage?: string | null;
  onRetryCatalog?: () => void;
  onAddPermission: (permissionId: number) => void;
  onRemovePermission: (permissionId: number) => void;
}

export function RoleDetailsPermissionsTab({
  permissions,
  permissionCatalog,
  isLoadingPermissions,
  isEditable = true,
  isSaving = false,
  catalogErrorMessage = null,
  onRetryCatalog,
  onAddPermission,
  onRemovePermission,
}: RoleDetailsPermissionsTabProps) {
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
        isActionPending={isSaving}
        isActionDisabled={() =>
          !isEditable || isSaving || Boolean(catalogErrorMessage)
        }
        onAction={(item) => {
          onAddPermission(item.payload.id);
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
        isActionPending={isSaving}
        isActionDisabled={() => !isEditable || isSaving}
        onAction={(item) => {
          onRemovePermission(item.payload.id);
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
