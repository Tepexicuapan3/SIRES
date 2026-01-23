import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  NAV_CONFIG,
  type NavItem,
} from "@/components/layouts/sidebar/nav-config";

interface BreadcrumbItemData {
  path: string;
  label: string;
}

const buildLabelMap = (items: NavItem[], map: Map<string, string>) => {
  items.forEach((item) => {
    if (item.url) {
      map.set(item.url, item.title);
    }
    if (item.items) {
      buildLabelMap(item.items, map);
    }
  });
};

const getLabelMap = () => {
  const map = new Map<string, string>();
  NAV_CONFIG.forEach((section) => buildLabelMap(section.items, map));
  return map;
};

const useBreadcrumbs = (): BreadcrumbItemData[] => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const labelMap = useMemo(() => getLabelMap(), []);

  if (pathSegments.length === 0) {
    return [];
  }

  return pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label =
      labelMap.get(path) ?? segment.charAt(0).toUpperCase() + segment.slice(1);

    return { path, label };
  });
};

/**
 * Breadcrumbs basados en nav-config.
 *
 * Razon industria:
 * - Mantiene labels consistentes con el menu lateral.
 * - Evita duplicar textos en rutas y UI.
 */
export const SidebarBreadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <span key={crumb.path} className="flex items-center gap-2">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage aria-current="page">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
