import type {
  NavItem,
  NavSection,
} from "@/components/layouts/sidebar/nav-config";

export interface NavigationFilterInput {
  sections: NavSection[];
  secondaryItems: NavItem[];
  isAdmin: boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export interface NavigationFilterResult {
  sections: NavSection[];
  secondaryItems: NavItem[];
}

const isNavItem = (item: NavItem | null): item is NavItem => item !== null;
const isNavSection = (section: NavSection | null): section is NavSection =>
  section !== null;

const filterNavItem = (
  item: NavItem,
  isAdmin: boolean,
  hasAnyPermission: (permissions: string[]) => boolean,
): NavItem | null => {
  if (!isAdmin && item.permissions && item.permissions.length > 0) {
    if (!hasAnyPermission(item.permissions)) return null;
  }

  if (item.items && item.items.length > 0) {
    const filteredChildren = item.items
      .map((child) => filterNavItem(child, isAdmin, hasAnyPermission))
      .filter(isNavItem);

    if (filteredChildren.length === 0 && !item.url) return null;

    return {
      ...item,
      items: filteredChildren,
    };
  }

  return item;
};

export const filterNavigation = (
  input: NavigationFilterInput,
): NavigationFilterResult => {
  const { sections, secondaryItems, isAdmin, hasAnyPermission } = input;

  const filteredSections = sections
    .map((section) => {
      if (!isAdmin && section.permissions && section.permissions.length > 0) {
        if (!hasAnyPermission(section.permissions)) return null;
      }

      const filteredItems = section.items
        .map((item) => filterNavItem(item, isAdmin, hasAnyPermission))
        .filter(isNavItem);

      if (filteredItems.length === 0) return null;

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter(isNavSection);

  const filteredSecondaryItems = secondaryItems
    .map((item) => filterNavItem(item, isAdmin, hasAnyPermission))
    .filter(isNavItem);

  return {
    sections: filteredSections,
    secondaryItems: filteredSecondaryItems,
  };
};
