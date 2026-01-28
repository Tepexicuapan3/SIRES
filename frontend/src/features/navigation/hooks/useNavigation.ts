/**
 * useNavigation.ts
 *
 * Hook que filtra la navegación según permisos y roles del usuario actual.
 * Implementa filtrado recursivo para soportar N niveles de anidamiento.
 */

import { useAuthSession } from "@features/auth/queries/useAuthSession";
import { usePermissions } from "@features/auth/queries/usePermissions";
import {
  NAV_CONFIG,
  NAV_SECONDARY,
  type NavSection,
  type NavItem,
} from "@/components/layouts/sidebar/nav-config";
import { filterNavigation } from "@features/navigation/domain/filterNavigation";

export interface UseNavigationReturn {
  sections: NavSection[];
  secondaryItems: NavItem[];
  isEmpty: boolean;
}

export function useNavigation(): UseNavigationReturn {
  const { data: user } = useAuthSession();
  const { hasAnyPermission, isAdmin } = usePermissions();

  if (!user) {
    return {
      sections: [],
      secondaryItems: [],
      isEmpty: true,
    };
  }

  const { sections, secondaryItems } = filterNavigation({
    sections: NAV_CONFIG,
    secondaryItems: NAV_SECONDARY,
    isAdmin: isAdmin(),
    hasAnyPermission,
  });

  return {
    sections,
    secondaryItems,
    isEmpty: sections.length === 0,
  };
}
