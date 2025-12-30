/**
 * useNavigation.ts
 *
 * Hook que filtra la navegación según permisos y roles del usuario actual.
 *
 * Filosofía:
 * - Lee la config desde nav-config.ts
 * - Aplica filtros de permisos/roles usando RBAC 2.0
 * - Devuelve SOLO lo que el usuario puede ver
 * - El backend SIEMPRE valida (esto es solo UX)
 */

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@features/auth/hooks/usePermissions";
import {
  NAV_CONFIG,
  NAV_SECONDARY,
  type NavSection,
  type NavItem,
  type NavSubItem,
} from "@/components/layouts/sidebar/nav-config";

export interface UseNavigationReturn {
  /** Secciones principales filtradas por permisos/roles */
  sections: NavSection[];
  /** Items secundarios (Support, Feedback) - siempre visibles */
  secondaryItems: NavItem[];
  /** Flag: si el usuario no tiene ningún menú disponible */
  isEmpty: boolean;
}

/**
 * Hook principal para obtener navegación filtrada.
 *
 * Ejemplo de uso:
 * ```tsx
 * const { sections, secondaryItems } = useNavigation()
 *
 * {sections.map(section => (
 *   <NavSection key={section.title} {...section} />
 * ))}
 * ```
 */
export function useNavigation(): UseNavigationReturn {
  const { user } = useAuthStore();
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions();

  const filteredSections = useMemo(() => {
    if (!user) return [];

    const isAdminUser = isAdmin();

    return NAV_CONFIG.map((section) => {
      // 1. Verificar si el usuario puede ver la sección completa
      const canViewSection = canUserViewSection(
        section,
        user.roles || [],
        isAdminUser,
      );

      if (!canViewSection) {
        return null;
      }

      // 2. Filtrar items de la sección
      const filteredItems = section.items
        .map((item) => filterNavItem(item, hasAnyPermission, isAdminUser))
        .filter((item): item is NavItem => item !== null);

      // 3. Si después de filtrar no quedan items, ocultar la sección
      if (filteredItems.length === 0) {
        return null;
      }

      return {
        ...section,
        items: filteredItems,
      };
    }).filter((section): section is NavSection => section !== null);
  }, [user, hasPermission, hasAnyPermission, isAdmin]);

  return {
    sections: filteredSections,
    secondaryItems: NAV_SECONDARY, // Siempre visibles (Support/Feedback)
    isEmpty: filteredSections.length === 0,
  };
}

/**
 * Verifica si el usuario puede ver una sección completa.
 *
 * Lógica:
 * - Si la sección tiene `roles`, el usuario debe tener AL MENOS uno
 * - Si la sección tiene `permissions`, el usuario debe tener AL MENOS uno
 * - Si no tiene ni roles ni permissions, es pública (todos la ven)
 * - Admins ven todo
 */
function canUserViewSection(
  section: NavSection,
  userRoles: string[],
  isAdmin: boolean,
): boolean {
  // Admins ven todo
  if (isAdmin) return true;

  // Si no tiene restricciones, es pública
  if (!section.roles && !section.permissions) return true;

  // Check roles
  if (section.roles && section.roles.length > 0) {
    const hasRole = section.roles.some((role) => userRoles.includes(role));
    if (hasRole) return true;
  }

  // Check permissions (se delega al hook usePermissions en filterNavItem)
  // Por ahora, si tiene roles y no matchea, no puede ver la sección
  if (section.roles && section.roles.length > 0) {
    return false;
  }

  return true;
}

/**
 * Filtra un NavItem y sus sub-items según permisos.
 *
 * Lógica:
 * - Si el item tiene `permissions`, el usuario debe tener AL MENOS uno
 * - Si no tiene permissions, es público
 * - Filtra recursivamente los sub-items
 * - Si después de filtrar no quedan sub-items Y el item principal requiere permisos que no tiene, se oculta
 */
function filterNavItem(
  item: NavItem,
  hasAnyPermission: (permissions: string[]) => boolean,
  isAdmin: boolean,
): NavItem | null {
  // Admins ven todo
  if (isAdmin) {
    return item;
  }

  // Check permisos del item principal
  const canViewItem =
    !item.permissions ||
    item.permissions.length === 0 ||
    hasAnyPermission(item.permissions);

  if (!canViewItem) {
    return null;
  }

  // Si tiene sub-items, filtrarlos
  if (item.items && item.items.length > 0) {
    const filteredSubItems = item.items
      .map((subItem) => filterNavSubItem(subItem, hasAnyPermission, isAdmin))
      .filter((subItem): subItem is NavSubItem => subItem !== null);

    // Si después de filtrar no quedan sub-items, devolver el item sin sub-items
    // (puede que el item principal sea clickeable sin sub-menú)
    return {
      ...item,
      items: filteredSubItems.length > 0 ? filteredSubItems : undefined,
    };
  }

  return item;
}

/**
 * Filtra un NavSubItem según permisos.
 */
function filterNavSubItem(
  subItem: NavSubItem,
  hasAnyPermission: (permissions: string[]) => boolean,
  isAdmin: boolean,
): NavSubItem | null {
  // Admins ven todo
  if (isAdmin) {
    return subItem;
  }

  // Check permisos del sub-item
  const canViewSubItem =
    !subItem.permissions ||
    subItem.permissions.length === 0 ||
    hasAnyPermission(subItem.permissions);

  return canViewSubItem ? subItem : null;
}
