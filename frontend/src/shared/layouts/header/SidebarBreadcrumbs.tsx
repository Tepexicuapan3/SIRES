import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@shared/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { TruncatedTooltip } from "@shared/ui/truncated-tooltip";
import { useNavigation } from "@features/navigation/hooks/useNavigation";
import type { NavItem, NavSection } from "@app/navigation/nav-config";

interface BreadcrumbItemData {
  path: string;
  label: string;
}

type BreadcrumbDisplayItem =
  | { type: "ellipsis"; title: string }
  | { type: "crumb"; data: BreadcrumbItemData };

const walkItems = (items: NavItem[], map: Map<string, string>) => {
  items.forEach((item) => {
    if (item.url) {
      map.set(item.url, item.title);
    }
    if (item.items) {
      walkItems(item.items, map);
    }
  });
};

/**
 * Construye el mapa url -> label a partir de las secciones ACTUALES
 * (`useNavigation()`), no de una constante estatica.
 *
 * Bug corregido: antes `LABEL_MAP` se calculaba UNA SOLA VEZ al importar
 * el modulo desde `NAV_CONFIG` (nunca se recalculaba, ni siquiera cuando
 * el arbol viene del backend). Ahora vive en `useMemo` con `[sections]`
 * como dependencia, asi que se recalcula si la fuente cambia (fallback
 * <-> backend, o alta de un modulo nuevo tras invalidar la query).
 */
const buildLabelMap = (sections: NavSection[]): Map<string, string> => {
  const map = new Map<string, string>();
  sections.forEach((section) => walkItems(section.items, map));
  return map;
};

const useBreadcrumbs = (): BreadcrumbItemData[] => {
  const location = useLocation();
  const { sections } = useNavigation();
  const labelMap = useMemo(() => buildLabelMap(sections), [sections]);
  const pathSegments = location.pathname.split("/").filter(Boolean);

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

const getVisibleCrumbs = (
  crumbs: BreadcrumbItemData[],
  maxItems: number,
): BreadcrumbDisplayItem[] => {
  if (crumbs.length <= maxItems) {
    return crumbs.map((data) => ({ type: "crumb" as const, data }));
  }

  const hidden = crumbs.slice(0, crumbs.length - maxItems);
  const visible = crumbs.slice(-maxItems);
  const hiddenTitle = hidden.map((item) => item.label).join(" / ");

  return [
    { type: "ellipsis" as const, title: hiddenTitle || "Más niveles" },
    ...visible.map((data) => ({ type: "crumb" as const, data })),
  ];
};

const renderBreadcrumbList = (
  items: BreadcrumbDisplayItem[],
  classNames: {
    list: string;
    link: string;
    page: string;
    ellipsis: string;
  },
) => {
  return (
    <BreadcrumbList className={classNames.list}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (item.type === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              <BreadcrumbItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BreadcrumbPage
                      aria-label="Más niveles"
                      className={classNames.ellipsis}
                    >
                      ...
                    </BreadcrumbPage>
                  </TooltipTrigger>
                  <TooltipContent>{item.title}</TooltipContent>
                </Tooltip>
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        }

        const { data } = item;

        return (
          <span key={data.path} className="flex min-w-0 items-center gap-2">
            <BreadcrumbItem className="min-w-0">
              {isLast ? (
                <TruncatedTooltip
                  label={data.label}
                  className={`${classNames.page} block`}
                >
                  {data.label}
                </TruncatedTooltip>
              ) : (
                <BreadcrumbLink asChild className="min-w-0">
                  <Link to={data.path}>
                    <TruncatedTooltip
                      label={data.label}
                      className={`${classNames.link} block`}
                    >
                      {data.label}
                    </TruncatedTooltip>
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </span>
        );
      })}
    </BreadcrumbList>
  );
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
  const desktopItems = getVisibleCrumbs(breadcrumbs, 3);
  const mobileItems = getVisibleCrumbs(breadcrumbs, 2);

  return (
    <TooltipProvider>
      <Breadcrumb className="min-w-0">
        {renderBreadcrumbList(mobileItems, {
          list: "flex min-w-0 flex-nowrap overflow-hidden sm:hidden",
          link: "max-w-20 truncate",
          page: "max-w-24 truncate",
          ellipsis: "max-w-12 truncate",
        })}
        {renderBreadcrumbList(desktopItems, {
          list: "hidden min-w-0 flex-nowrap overflow-hidden sm:flex",
          link: "max-w-32 truncate",
          page: "max-w-40 truncate",
          ellipsis: "max-w-20 truncate",
        })}
      </Breadcrumb>
    </TooltipProvider>
  );
};
