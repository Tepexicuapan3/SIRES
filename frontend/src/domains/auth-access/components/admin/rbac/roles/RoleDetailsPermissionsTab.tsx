import { useState } from "react";
import { CalendarDays, Plus, UserRound, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { formatDateTime } from "@/domains/auth-access/adapters/rbac/roles/roles.format";
import { PermissionsHierarchyExplorer } from "@/domains/auth-access/components/admin/rbac/shared/PermissionHierarchyExplorer";
import { PermissionCreateDialog } from "@/domains/auth-access/components/admin/rbac/permissions/PermissionCreateDialog";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import type { Permission, RolePermission } from "@api/types";

/** Leyenda especifica para roles admin -- distinta del mensaje generico de
 * "es de sistema" o "no tienes permisos": el rol admin SI tiene acceso,
 * solo que no se administra via RelRolPermiso. */
const ADMIN_ACCESS_MESSAGE =
  "Este rol tiene acceso total automatico a todos los permisos y modulos -- no depende de asignaciones individuales.";

/** Sello de "asignacion automatica" que se muestra en vez de usuario/fecha
 * cuando el permiso viene del catalogo completo (rol admin), no de una fila
 * real en RelRolPermiso. */
const AUTOMATIC_ASSIGNMENT: RolePermission["assignedBy"] = {
  id: 0,
  name: "Automatico (rol admin)",
};

interface RoleDetailsPermissionsTabProps {
  permissions: RolePermission[];
  permissionCatalog: Permission[];
  isLoadingPermissions: boolean;
  isEditable?: boolean;
  /**
   * Rol con `is_admin=true`. El RBACResolver le da acceso total dinamico
   * (wildcard) sin depender de RelRolPermiso, asi que esta tab ignora la
   * lista real de `permissions` y muestra TODO el catalogo como asignado,
   * en modo solo lectura.
   */
  isAdmin?: boolean;
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
  isAdmin = false,
  readOnlyMessage = "Solo lectura: no puedes actualizar este rol porque no tienes permisos.",
  catalogAccessMessage = null,
  isSaving = false,
  catalogErrorMessage = null,
  onRetryCatalog,
  onAddPermission,
  onRemovePermission,
}: RoleDetailsPermissionsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const displayedAssignedPermissions: RolePermission[] = isAdmin
    ? permissionCatalog.map((permission) => ({
        id: permission.id,
        code: permission.code,
        description: permission.description,
        assignedAt: "",
        assignedBy: AUTOMATIC_ASSIGNMENT,
      }))
    : permissions;
  const assignedIds = new Set(
    displayedAssignedPermissions.map((permission) => permission.id),
  );
  const availablePermissions = isAdmin
    ? []
    : permissionCatalog.filter((permission) => !assignedIds.has(permission.id));
  const showCatalogAccessNotice =
    Boolean(catalogAccessMessage) && isEditable && !isAdmin;
  const showCatalogErrorBanner =
    Boolean(catalogErrorMessage) && isEditable && !isAdmin && !showCatalogAccessNotice;

  return (
    <div className="space-y-6">
      <PermissionCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {isAdmin ? (
        <AdminReadOnlyNotice message={ADMIN_ACCESS_MESSAGE} />
      ) : !isEditable ? (
        <AdminReadOnlyNotice message={readOnlyMessage} />
      ) : null}
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
        emptyMessage={
          isAdmin
            ? "Este rol ya tiene acceso a todos los permisos automaticamente."
            : "No hay permisos disponibles para agregar."
        }
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
        description={
          isAdmin
            ? "Acceso total automatico -- se muestra el catalogo completo."
            : "Visualiza y gestiona los permisos activos del rol de forma jerarquica."
        }
        permissions={displayedAssignedPermissions}
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
        renderMeta={(permission) =>
          isAdmin ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <UserRound className="size-3.5" />
              <span className="truncate">Incluido automaticamente</span>
            </span>
          ) : (
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
          )
        }
      />
    </div>
  );
}
