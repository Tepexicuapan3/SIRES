import { useState } from "react";
import { CalendarDays, Plus, UserRound, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { formatDateTime } from "@/domains/auth-access/adapters/rbac/roles/roles.format";
import { PermissionsHierarchyExplorer } from "@/domains/auth-access/components/admin/rbac/shared/PermissionHierarchyExplorer";
import { PermissionCreateDialog } from "@/domains/auth-access/components/admin/rbac/permissions/PermissionCreateDialog";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import type { Permission, RolePermission } from "@api/types";

interface RoleDetailsPermissionsTabProps {
  permissions: RolePermission[];
  permissionCatalog: Permission[];
  isLoadingPermissions: boolean;
  isEditable?: boolean;
  readOnlyMessage?: string;
  catalogAccessMessage?: string | null;
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
  readOnlyMessage = "Solo lectura: no puedes actualizar este rol porque no tienes permisos.",
  catalogAccessMessage = null,
  isSaving = false,
  catalogErrorMessage = null,
  onRetryCatalog,
  onAddPermission,
  onRemovePermission,
}: RoleDetailsPermissionsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const assignedIds = new Set(permissions.map((permission) => permission.id));
  const availablePermissions = permissionCatalog.filter(
    (permission) => !assignedIds.has(permission.id),
  );
  const showCatalogAccessNotice = Boolean(catalogAccessMessage) && isEditable;
  const showCatalogErrorBanner =
    Boolean(catalogErrorMessage) && isEditable && !showCatalogAccessNotice;

  return (
    <div className="space-y-6">
      <PermissionCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {!isEditable ? <AdminReadOnlyNotice message={readOnlyMessage} /> : null}
      {showCatalogAccessNotice ? (
        <AdminReadOnlyNotice message={catalogAccessMessage} />
      ) : null}

      {showCatalogErrorBanner ? (
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

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-txt-body">Catalogo de permisos</p>
          <p className="text-xs text-txt-muted">
            Busca y agrega permisos organizados por Grupo -&gt; Modulo -&gt; Submodulo -&gt; Accion.
          </p>
        </div>
        {isEditable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="size-4" />
            Nuevo permiso
          </Button>
        ) : null}
      </div>

      <PermissionsHierarchyExplorer
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
          !isEditable ||
          isSaving ||
          showCatalogErrorBanner ||
          showCatalogAccessNotice
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
