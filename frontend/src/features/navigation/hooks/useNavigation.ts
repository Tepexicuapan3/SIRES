/**
 * useNavigation.ts
 *
 * Hook que filtra la navegación según permisos y roles del usuario actual.
 * Implementa filtrado recursivo para soportar N niveles de anidamiento.
 */

import { useAuthSession } from "@/domains/auth-access/hooks/useAuthSession";
import { usePermissions } from "@/domains/auth-access/hooks/usePermissions";
import { NAV_CONFIG, NAV_SECONDARY } from "@app/navigation/nav-config";
import { filterNavigation } from "@features/navigation/domain/filterNavigation";
import type {
  NavigationItem,
  NavigationSection,
} from "@features/navigation/domain/navigation.types";

export interface UseNavigationReturn {
  sections: NavigationSection[];
  secondaryItems: NavigationItem[];
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
