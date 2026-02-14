import { CalendarDays, Plus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@features/admin/modules/rbac/roles/utils/roles.format";
import { PermissionsHierarchyExplorer } from "@features/admin/modules/rbac/shared/components/PermissionHierarchyExplorer";
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

      <PermissionsHierarchyExplorer
        title="Catalogo de permisos"
        description="Busca y agrega permisos organizados por Grupo -> Modulo -> Submodulo -> Accion."
        permissions={availablePermissions}
        isLoading={isLoadingPermissions}
        emptyMessage="No hay permisos disponibles para agregar."
        actionLabel="Agregar"
        actionIcon={<Plus className="size-4" />}
        actionVariant="outline"
        actionDisplay="icon"
        viewportHeightClassName="h-[360px]"
        isActionPending={isSaving}
        isActionDisabled={() =>
          !isEditable || isSaving || Boolean(catalogErrorMessage)
        }
        onAction={(permission) => {
          onAddPermission(permission.id);
        }}
        actionAriaLabel={(permission) => `Agregar permiso ${permission.code}`}
      />

      <PermissionsHierarchyExplorer
        title="Permisos asignados al rol"
        description="Visualiza y gestiona los permisos activos del rol de forma jerarquica."
        permissions={permissions}
        emptyMessage="Este rol no tiene permisos asignados."
        actionDisplay="icon"
        actionIcon={<X className="size-4" />}
        actionVariant="ghost"
        actionClassName="size-8 shrink-0 rounded-lg"
        metaDisplay="footer"
        showCodeBadge={false}
        viewportHeightClassName="h-[360px]"
        isActionPending={isSaving}
        isActionDisabled={() => !isEditable || isSaving}
        onAction={(permission) => {
          onRemovePermission(permission.id);
        }}
        actionAriaLabel={(permission) => `Remover permiso ${permission.code}`}
        renderMeta={(permission) => (
          <>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <UserRound className="size-3.5" />
              <span className="truncate">
                {permission.assignedBy?.name ?? "-"}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <CalendarDays className="size-3.5" />
              {permission.assignedAt
                ? formatDateTime(permission.assignedAt)
                : "-"}
            </span>
          </>
        )}
      />
    </div>
  );
}
