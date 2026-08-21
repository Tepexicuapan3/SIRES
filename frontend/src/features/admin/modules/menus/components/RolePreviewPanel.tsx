import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Skeleton } from "@shared/ui/skeleton";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { NAV_CONFIG, NAV_SECONDARY } from "@app/navigation/nav-config";
import { filterNavigation } from "@features/navigation/domain/filterNavigation";
import { mapNavigationMenu } from "@features/navigation/domain/mapNavigationMenu";
import { useNavigationMenu } from "@features/navigation/queries/useNavigationMenu";
import { useRolesList } from "@/domains/auth-access/hooks/rbac/roles/useRolesList";
import { useRoleDetail } from "@/domains/auth-access/hooks/rbac/roles/useRoleDetail";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type {
  NavigationItem,
  NavigationSection,
} from "@features/navigation/domain/navigation.types";

/**
 * Preview "Ver el menu como: [rol]" (D5 del design de
 * `menu-modulos-crud-ui`): reusa `filterNavigation` -- la misma funcion pura
 * que ya usa `useNavigation` para el sidebar real -- inyectando un
 * `hasAnyPermission` armado a partir de los permisos EFECTIVOS del rol
 * elegido (`useRoleDetail`). Cero endpoint nuevo: la fuente del arbol es
 * `useNavigationMenu` (misma query que el sidebar, con el mismo fallback a
 * `NAV_CONFIG`/`NAV_SECONDARY` si el flag esta OFF o el arbol viene vacio).
 *
 * Roles con `isAdmin=true` (wildcard dinamico del `RBACResolver`, ver
 * `sires/rbac/admin-role-ui-display-fix`) se pasan tal cual a
 * `filterNavigation({isAdmin: true, ...})`, que ya bypassea el chequeo de
 * permisos para ese caso -- el preview muestra el arbol COMPLETO, nunca
 * vacio, sin necesitar logica propia para el caso admin.
 */
export function RolePreviewPanel() {
  const { hasCapability } = usePermissionDependencies();
  const canReadRoles = hasCapability("admin.roles.read", {
    allOf: ["admin:gestion:roles:read"],
  });

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const { data: rolesData, isLoading: isLoadingRoles } = useRolesList(
    { page: 1, pageSize: 100, isActive: true },
    { enabled: canReadRoles },
  );
  const roles = rolesData?.items ?? [];

  const roleId = selectedRoleId ? Number(selectedRoleId) : undefined;
  const { data: roleDetail, isLoading: isLoadingDetail } = useRoleDetail(
    roleId,
    canReadRoles && Boolean(roleId),
  );

  const menuQuery = useNavigationMenu();
  const menuData = menuQuery.data;
  const isMenuFallback =
    menuQuery.isLoading ||
    menuQuery.isError ||
    !menuData ||
    menuData.source !== "db" ||
    menuData.sections.length === 0;
  const mappedMenu = useMemo(
    () => (!isMenuFallback && menuData ? mapNavigationMenu(menuData) : null),
    [isMenuFallback, menuData],
  );

  const previewResult = useMemo(() => {
    if (!roleDetail) return null;

    const sections: NavigationSection[] = mappedMenu
      ? mappedMenu.sections
      : NAV_CONFIG;
    const secondaryItems: NavigationItem[] = mappedMenu
      ? mappedMenu.secondaryItems
      : NAV_SECONDARY;
    const permissionCodes = new Set(
      roleDetail.permissions.map((permission) => permission.code),
    );

    return filterNavigation({
      sections,
      secondaryItems,
      isAdmin: roleDetail.role.isAdmin,
      hasAnyPermission: (permissions) =>
        permissions.some((code) => permissionCodes.has(code)),
    });
  }, [roleDetail, mappedMenu]);

  const isEmptyResult =
    previewResult !== null &&
    previewResult.sections.length === 0 &&
    previewResult.secondaryItems.length === 0;

  if (!canReadRoles) {
    return (
      <div className="space-y-3 rounded-xl border border-line-struct/60 bg-subtle/20 p-4">
        <PanelHeading />
        <AdminReadOnlyNotice message="No tienes acceso al catalogo de roles para ver este preview." />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-line-struct/60 bg-subtle/20 p-4">
      <PanelHeading />

      <Select
        value={selectedRoleId}
        onValueChange={setSelectedRoleId}
        disabled={isLoadingRoles || roles.length === 0}
      >
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Selecciona un rol" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.id} value={String(role.id)}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedRoleId ? null : isLoadingDetail || !previewResult ? (
        <div className="space-y-2 rounded-xl border border-line-struct/60 bg-paper/40 p-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={`role-preview-skeleton-${index}`}
              className={index % 2 === 0 ? "h-8 w-full" : "h-8 w-[85%]"}
            />
          ))}
        </div>
      ) : isEmptyResult ? (
        <div className="rounded-xl border border-dashed border-line-struct/70 bg-paper/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-txt-body">
            Este rol no ve ningun modulo en el menu.
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-line-struct/60 bg-paper/40 p-3">
          {previewResult.sections.map((section) => (
            <PreviewSection key={section.title} section={section} />
          ))}
          {previewResult.secondaryItems.length > 0 ? (
            <PreviewSection
              section={{ title: "Otros", items: previewResult.secondaryItems }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function PanelHeading() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Eye className="size-4 text-txt-muted" />
        <p className="text-sm font-semibold text-txt-body">
          Ver el menu como
        </p>
      </div>
      <p className="text-xs text-txt-muted">
        Elige un rol para ver el menu de navegacion tal como lo veria ese rol.
      </p>
    </div>
  );
}

function PreviewSection({ section }: { section: NavigationSection }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-txt-muted">
        {section.title}
      </p>
      <div className="space-y-1">
        {section.items.map((item) => (
          <PreviewItem key={item.title} item={item} depth={0} />
        ))}
      </div>
    </div>
  );
}

function PreviewItem({ item, depth }: { item: NavigationItem; depth: number }) {
  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-txt-body"
        style={{ marginLeft: depth * 16 }}
      >
        {item.icon ? (
          <item.icon className="size-4 shrink-0 text-txt-muted" />
        ) : null}
        <span className="truncate">{item.title}</span>
        {item.badge ? (
          <span className="ml-auto shrink-0 rounded-full bg-subtle px-1.5 py-0.5 text-[10px] text-txt-muted">
            {item.badge}
          </span>
        ) : null}
      </div>
      {item.items?.length ? (
        <div className="space-y-1">
          {item.items.map((child) => (
            <PreviewItem key={child.title} item={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
