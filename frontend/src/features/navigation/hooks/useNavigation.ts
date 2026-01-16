/**
 * useNavigation.ts
 *
 * Hook que filtra la navegación según permisos y roles del usuario actual.
 * Implementa filtrado recursivo para soportar N niveles de anidamiento.
 */

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@features/auth/hooks/usePermissions";
import {
  NAV_CONFIG,
  NAV_SECONDARY,
  type NavSection,
  type NavItem,
} from "@/components/layouts/sidebar/nav-config";

export interface UseNavigationReturn {
  sections: NavSection[];
  secondaryItems: NavItem[];
  isEmpty: boolean;
}

export function useNavigation(): UseNavigationReturn {
  const { user } = useAuthStore();
  const { hasAnyPermission, isAdmin } = usePermissions();

  /**
   * Función recursiva para filtrar items de navegación
   */
  const filterItem = (item: NavItem): NavItem | null => {
    const isUserAdmin = isAdmin();

    // 1. Verificar permisos directos del item (si no es admin)
    if (!isUserAdmin && item.permissions && item.permissions.length > 0) {
      if (!hasAnyPermission(item.permissions)) {
        return null; // Ocultar si no tiene permisos
      }
    }

    // 2. Procesar hijos recursivamente
    if (item.items && item.items.length > 0) {
      const filteredChildren = item.items
        .map(child => filterItem(child))
        .filter((child): child is NavItem => child !== null);

      // 3. Regla de Propagación (Bubbling):
      // Si el item es una "carpeta" (no tiene URL propia) y se quedó sin hijos,
      // entonces el item entero carece de sentido y debe ocultarse.
      if (filteredChildren.length === 0 && !item.url) {
        return null;
      }

      // Retornar item con hijos filtrados
      return {
        ...item,
        items: filteredChildren
      };
    }

    // 4. Caso base: Item hoja (sin hijos) con permisos válidos
    return item;
  };

  const filteredSections = useMemo(() => {
    if (!user) return [];

    const isUserAdmin = isAdmin();

    return NAV_CONFIG.map((section) => {
      // 1. Filtro de Nivel Sección (Permisos globales)
      // Si la sección requiere permisos específicos
      if (!isUserAdmin && section.permissions && section.permissions.length > 0) {
        if (!hasAnyPermission(section.permissions)) return null;
      }

      // 2. Filtrar items de la sección recursivamente
      const filteredItems = section.items
        .map(filterItem)
        .filter((item): item is NavItem => item !== null);

      // Si la sección se quedó vacía, no la mostramos
      if (filteredItems.length === 0) {
        return null;
      }

      return {
        ...section,
        items: filteredItems,
      };
    }).filter((section): section is NavSection => section !== null);
  }, [user, hasAnyPermission, isAdmin]);

  return {
    sections: filteredSections,
    secondaryItems: NAV_SECONDARY,
    isEmpty: filteredSections.length === 0,
  };
}
