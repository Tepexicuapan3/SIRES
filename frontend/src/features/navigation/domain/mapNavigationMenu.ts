import { resolveNavIcon } from "@app/navigation/nav-icons";
import type {
  NavigationMenuItemDTO,
  NavigationMenuResponse,
  NavigationMenuSectionDTO,
} from "@api/types/navigation.types";
import type {
  NavigationItem,
  NavigationSection,
} from "@features/navigation/domain/navigation.types";

export interface MappedNavigationMenu {
  sections: NavigationSection[];
  secondaryItems: NavigationItem[];
}

/**
 * Mapea un nodo del DTO (`icon` como string|null) a `NavigationItem`
 * (`icon` como componente `LucideIcon` opcional).
 *
 * Solo se resuelve el icono si el DTO trae un string no vacio: un
 * `icon: null` explicito (nodo que nunca tuvo icono en `nav-config.ts`)
 * se mapea a `icon: undefined` para preservar el render exacto de
 * `NavMain`/`ModuleSearch` (que solo pintan `<item.icon />` si existe).
 * Un string presente pero desconocido en `NAV_ICONS` SI cae al default
 * (`Circle`) via `resolveNavIcon`.
 */
const mapItem = (dto: NavigationMenuItemDTO): NavigationItem => {
  const item: NavigationItem = {
    title: dto.title,
    permissions: dto.permissions,
  };

  if (dto.icon) item.icon = resolveNavIcon(dto.icon);
  if (dto.url) item.url = dto.url;
  if (dto.badge) item.badge = dto.badge;
  if (dto.items && dto.items.length > 0) {
    item.items = dto.items.map(mapItem);
  }

  return item;
};

const mapSection = (dto: NavigationMenuSectionDTO): NavigationSection => ({
  title: dto.title,
  permissions: dto.permissions,
  items: dto.items.map(mapItem),
});

/**
 * Convierte la respuesta cruda de `GET /navigation-menu` al shape
 * `NavigationSection[]`/`NavigationItem[]` que ya consumen
 * `filterNavigation`, `NavMain`, `SidebarBreadcrumbs` y `ModuleSearch`.
 */
export const mapNavigationMenu = (
  response: NavigationMenuResponse,
): MappedNavigationMenu => ({
  sections: response.sections.map(mapSection),
  secondaryItems: response.secondaryItems.map(mapItem),
});
