/**
 * useNavigation.ts
 *
 * Hook que filtra la navegación según permisos y roles del usuario actual.
 * Implementa filtrado recursivo para soportar N niveles de anidamiento.
 */

import {
  useAuthSession,
  usePermissions,
} from "@/domains/auth-access/contracts/navigation-auth";
// NAV_CONFIG/NAV_SECONDARY son el fallback permanente cuando el endpoint
// falla o el flag backend esta OFF (ver nav-config.ts, @deprecated como
// fuente principal pero se mantiene indefinidamente como respaldo).
import { NAV_CONFIG, NAV_SECONDARY } from "@app/navigation/nav-config";
import { filterNavigation } from "@features/navigation/domain/filterNavigation";
import { mapNavigationMenu } from "@features/navigation/domain/mapNavigationMenu";
import { useNavigationMenu } from "@features/navigation/queries/useNavigationMenu";
import type { NavItem, NavSection } from "@app/navigation/nav-config";

export interface UseNavigationReturn {
  sections: NavSection[];
  secondaryItems: NavItem[];
  isEmpty: boolean;
  /** `true` mientras se resuelve el primer fetch de `/navigation-menu`. */
  isLoading?: boolean;
  /** `true` si esta sirviendo `NAV_CONFIG` (loading/error/flag-off/arbol
   * vacio) en vez del arbol de `cat_modulos`. */
  isFallback?: boolean;
}

/**
 * Hook que filtra la navegación según permisos y roles del usuario actual.
 * Implementa filtrado recursivo para soportar N niveles de anidamiento.
 *
 * Fuente de los datos: `useNavigationMenu()` (`GET /navigation-menu`,
 * backend). Ante loading, error, `source !== "db"` (flag OFF) o arbol
 * vacio, cae a `NAV_CONFIG`/`NAV_SECONDARY` locales -- el sidebar nunca
 * queda vacio por una falla del endpoint.
 *
 * Firma sin cambios respecto al hook previo (sincrono sobre NAV_CONFIG):
 * `sections`/`secondaryItems`/`isEmpty` siguen igual, así que
 * `AppSidebar`/`NavMain`/`NavSecondary` no requieren cambios.
 */
export function useNavigation(): UseNavigationReturn {
  const { data: user } = useAuthSession();
  const { hasAnyPermission, isAdmin } = usePermissions();
  const menuQuery = useNavigationMenu();

  if (!user) {
    return {
      sections: [],
      secondaryItems: [],
      isEmpty: true,
    };
  }

  const menuData = menuQuery.data;
  const isFallback =
    menuQuery.isLoading ||
    menuQuery.isError ||
    !menuData ||
    menuData.source !== "db" ||
    menuData.sections.length === 0;

  const mapped = !isFallback && menuData ? mapNavigationMenu(menuData) : null;

  const { sections, secondaryItems } = filterNavigation({
    sections: mapped ? mapped.sections : NAV_CONFIG,
    secondaryItems: mapped ? mapped.secondaryItems : NAV_SECONDARY,
    isAdmin: isAdmin(),
    hasAnyPermission,
  });

  return {
    sections,
    secondaryItems,
    isEmpty: sections.length === 0,
    isLoading: menuQuery.isLoading,
    isFallback,
  };
}
