import { useMemo, useState } from "react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Skeleton } from "@shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/ui/tooltip";
import { cn } from "@shared/utils/styling/cn";
import { resolveNavIcon } from "@/app/navigation/nav-icons";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import {
  ModuleImpactDialog,
  type ModuleImpactAction,
} from "@/domains/auth-access/components/admin/rbac/roles/ModuleImpactDialog";
import {
  buildPermissionModuleIndex,
  getCollateralModules,
  getModuleState,
  resolveNodePermissionIds,
  type ModuleRef,
} from "@/domains/auth-access/adapters/rbac/roles/roles.module-tree";
import type { ModuleCatalogNodeDTO, Permission, RolePermission } from "@api/types";

interface PendingModuleToggle {
  node: ModuleCatalogNodeDTO;
  nextChecked: boolean;
  collateral: ModuleRef[];
}

/** Leyenda especifica para roles admin -- distinta del mensaje generico de
 * "es de sistema" o "no tienes permisos": el rol admin SI tiene acceso,
 * solo que no se administra via RelRolPermiso. */
const ADMIN_ACCESS_MESSAGE =
  "Este rol tiene acceso total automatico a todos los permisos y modulos -- no depende de asignaciones individuales.";

interface RoleDetailsModulesTabProps {
  modules: ModuleCatalogNodeDTO[];
  isLoadingModules: boolean;
  workingPermissions: RolePermission[];
  permissionCatalog: Permission[];
  actorPermissions: string[];
  isEditable?: boolean;
  /**
   * Rol con `is_admin=true`. El RBACResolver le da acceso total dinamico
   * (wildcard) sin depender de RelRolPermiso, asi que esta tab ignora el
   * estado real de `workingPermissions` y muestra todos los nodos
   * administrables como tildados, en modo solo lectura.
   */
  isAdmin?: boolean;
  readOnlyMessage?: string;
  catalogAccessMessage?: string | null;
  isSaving?: boolean;
  moduleCatalogErrorMessage?: string | null;
  onRetryModuleCatalog?: () => void;
  onToggleModule: (permissionIds: number[], nextChecked: boolean) => void;
}

export function RoleDetailsModulesTab({
  modules,
  isLoadingModules,
  workingPermissions,
  permissionCatalog,
  actorPermissions,
  isEditable = true,
  isAdmin = false,
  readOnlyMessage = "Solo lectura: no puedes actualizar este rol porque no tienes permisos.",
  catalogAccessMessage = null,
  isSaving = false,
  moduleCatalogErrorMessage = null,
  onRetryModuleCatalog,
  onToggleModule,
}: RoleDetailsModulesTabProps) {
  const [pendingToggle, setPendingToggle] = useState<PendingModuleToggle | null>(
    null,
  );

  const draftCodes = useMemo(
    () => new Set(workingPermissions.map((permission) => permission.code)),
    [workingPermissions],
  );
  const permissionIndex = useMemo(
    () => buildPermissionModuleIndex(modules),
    [modules],
  );
  const actorPermissionSet = useMemo(
    () => new Set(actorPermissions),
    [actorPermissions],
  );
  const hasWildcard = actorPermissionSet.has("*");

  // Sin catalogo de permisos no se pueden traducir codigos -> ids, asi que
  // la tab se muestra igual pero sin permitir tildar/destildar.
  const canToggle = isEditable && !catalogAccessMessage && !isAdmin;

  const applyToggle = (node: ModuleCatalogNodeDTO, nextChecked: boolean) => {
    const { ids } = resolveNodePermissionIds(node, permissionCatalog);
    if (ids.length === 0) return;
    onToggleModule(ids, nextChecked);
  };

  const handleToggleNode = (node: ModuleCatalogNodeDTO) => {
    if (!canToggle || isSaving) return;

    const state = getModuleState(node, draftCodes);
    if (state === "unmanaged") return;

    const nextChecked = state === "unchecked";
    const collateral = getCollateralModules(node, permissionIndex);

    if (collateral.length > 0) {
      setPendingToggle({ node, nextChecked, collateral });
      return;
    }

    applyToggle(node, nextChecked);
  };

  const handleConfirmImpact = () => {
    if (!pendingToggle) return;
    applyToggle(pendingToggle.node, pendingToggle.nextChecked);
    setPendingToggle(null);
  };

  const impactAction: ModuleImpactAction = pendingToggle?.nextChecked
    ? "check"
    : "uncheck";

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <AdminReadOnlyNotice message={ADMIN_ACCESS_MESSAGE} />
      ) : !isEditable ? (
        <AdminReadOnlyNotice message={readOnlyMessage} />
      ) : null}
      {isEditable && !isAdmin && catalogAccessMessage ? (
        <AdminReadOnlyNotice message={catalogAccessMessage} />
      ) : null}

      {isEditable && !isAdmin && !catalogAccessMessage && moduleCatalogErrorMessage ? (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-xs text-status-critical">
          <p>{moduleCatalogErrorMessage}</p>
          {onRetryModuleCatalog ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onRetryModuleCatalog}
            >
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-sm font-semibold text-txt-body">
          Arbol de modulos
        </p>
        <p className="text-xs text-txt-muted">
          Tilda o destilda modulos para controlar que ve este rol en el menu
          de navegacion. Algunos modulos comparten permisos: tildar uno puede
          afectar a otros.
        </p>
      </div>

      {isLoadingModules ? (
        <div className="space-y-2 rounded-xl border border-line-struct/60 bg-subtle/20 p-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`module-tree-skeleton-${index}`}
              className={cn("h-9", index % 3 === 0 ? "w-full" : "w-[92%]")}
            />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-struct/70 bg-subtle/20 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-txt-body">
            No hay modulos disponibles.
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] space-y-1.5 overflow-y-auto rounded-xl border border-line-struct/60 bg-subtle/20 p-3">
          {modules.map((node) => (
            <ModuleTreeNode
              key={node.key}
              node={node}
              depth={0}
              draftCodes={draftCodes}
              hasWildcard={hasWildcard}
              actorPermissionSet={actorPermissionSet}
              isDisabled={!canToggle || isSaving}
              isAdmin={isAdmin}
              onToggle={handleToggleNode}
            />
          ))}
        </div>
      )}

      <ModuleImpactDialog
        open={pendingToggle !== null}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
        action={impactAction}
        nodeTitle={pendingToggle?.node.title ?? ""}
        collateralModules={pendingToggle?.collateral ?? []}
        onConfirm={handleConfirmImpact}
      />
    </div>
  );
}

interface ModuleTreeNodeProps {
  node: ModuleCatalogNodeDTO;
  depth: number;
  draftCodes: Set<string>;
  hasWildcard: boolean;
  actorPermissionSet: Set<string>;
  isDisabled: boolean;
  /** Ver `RoleDetailsModulesTabProps.isAdmin`. Fuerza todo nodo administrable
   * a "checked", ignorando `draftCodes` (el estado real de RelRolPermiso). */
  isAdmin?: boolean;
  onToggle: (node: ModuleCatalogNodeDTO) => void;
}

function ModuleTreeNode({
  node,
  depth,
  draftCodes,
  hasWildcard,
  actorPermissionSet,
  isDisabled,
  isAdmin = false,
  onToggle,
}: ModuleTreeNodeProps) {
  const state = isAdmin
    ? node.permissions.length === 0
      ? "unmanaged"
      : "checked"
    : getModuleState(node, draftCodes);
  const isUnmanaged = state === "unmanaged";
  const isChecked = state === "checked";
  // Bajo isAdmin, el checkbox ya esta disabled por una razon distinta (el
  // rol es admin, no que al actor le falte el permiso) -- no tiene sentido
  // mostrar el badge "Sin permiso" en ese caso.
  const canManage =
    isAdmin ||
    hasWildcard ||
    node.permissions.every((code) => actorPermissionSet.has(code));
  const checkboxDisabled = isDisabled || isUnmanaged || !canManage;
  // Se guarda dentro de un objeto (acceso por member expression, `icon.Component`)
  // en vez de una variable capitalizada suelta -- evita el falso positivo de
  // react-hooks/static-components, que no puede verificar que `resolveNavIcon`
  // siempre devuelve la misma referencia estable del mapa `NAV_ICONS`. Mismo
  // patron que `NavMain.tsx` (`<item.icon />`).
  const icon = { Component: resolveNavIcon(node.icon) };

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center justify-between gap-3 rounded-lg border border-line-struct/45 bg-paper/50 px-3 py-2"
        style={{ marginLeft: depth * 20 }}
      >
        <label className="flex min-w-0 flex-1 items-center gap-2.5">
          <Checkbox
            checked={isChecked}
            disabled={checkboxDisabled}
            onCheckedChange={() => onToggle(node)}
            aria-label={`${isChecked ? "Quitar" : "Agregar"} modulo ${node.title}`}
          />
          <icon.Component className="size-4 shrink-0 text-txt-muted" />
          <span className="truncate text-sm font-medium text-txt-body">
            {node.title}
          </span>
        </label>

        {isUnmanaged ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Siempre visible
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Este modulo no declara permisos: es visible para todos los
              roles y no se administra desde aca.
            </TooltipContent>
          </Tooltip>
        ) : !canManage ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] text-txt-muted"
              >
                Sin permiso
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              No podes asignar permisos que no tenes.
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {node.items.length > 0
        ? node.items.map((child) => (
            <ModuleTreeNode
              key={child.key}
              node={child}
              depth={depth + 1}
              draftCodes={draftCodes}
              hasWildcard={hasWildcard}
              actorPermissionSet={actorPermissionSet}
              isDisabled={isDisabled}
              isAdmin={isAdmin}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  );
}
