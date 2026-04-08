/**
 * NavMain.tsx
 *
 * Componente que renderiza las secciones principales de navegación.
 * Implementa renderizado recursivo para soportar N niveles de anidamiento.
 * Persistencia de estado de menús abiertos vía Zustand.
 */

import { ChevronRight, Circle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Badge } from "@shared/ui/badge";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@shared/ui/sidebar";
import { useSidebar } from "@shared/ui/sidebar-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/ui/tooltip";
import { TruncatedTooltip } from "@shared/ui/truncated-tooltip";
import { cn } from "@shared/utils/styling/cn";
import { useSidebarStore } from "@app/state/ui/sidebarStore";
import type { NavItem, NavSection } from "@app/navigation/nav-config";

interface NavMainProps {
  sections: NavSection[];
}

const BADGE_LABELS = {
  Dev: "Dev",
  New: "Nvo",
  Mantenimiento: "Mtto",
} as const;

type BadgeKey = keyof typeof BADGE_LABELS;

const BADGE_VARIANTS = {
  Dev: "alert",
  New: "info",
  Mantenimiento: "critical",
} as const;

const BADGE_DOT_STYLES: Record<BadgeKey, string> = {
  Dev: "bg-status-alert",
  New: "bg-status-info",
  Mantenimiento: "bg-status-critical",
};

const BADGE_TEXT_CLASSES = "max-w-[4rem] truncate";
const TITLE_TEXT_CLASSES = "max-w-[8.5rem] truncate block";

const resolveBadgeKey = (badge: string): BadgeKey =>
  badge in BADGE_LABELS ? (badge as BadgeKey) : "Dev";

const getBadgeVariant = (badge: string) =>
  BADGE_VARIANTS[resolveBadgeKey(badge)];
const BADGE_TOOLTIPS: Record<BadgeKey, string> = {
  Dev: "En desarrollo",
  New: "Nuevo",
  Mantenimiento: "Mantenimiento",
};

const getBadgeLabel = (badge: string) => BADGE_LABELS[resolveBadgeKey(badge)];
const getBadgeTooltip = (badge: string) =>
  BADGE_TOOLTIPS[resolveBadgeKey(badge)];

const renderBadge = (badge: string, withTooltip: boolean) => {
  const badgeNode = (
    <Badge
      variant={getBadgeVariant(badge)}
      className={cn(
        "shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        BADGE_TEXT_CLASSES,
        getBadgeRingClass(badge),
      )}
    >
      {getBadgeLabel(badge)}
    </Badge>
  );

  if (!withTooltip) return badgeNode;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeNode}</TooltipTrigger>
      <TooltipContent side="top" align="end">
        {getBadgeTooltip(badge)}
      </TooltipContent>
    </Tooltip>
  );
};

const getBadgePriority = (items?: NavItem[]): BadgeKey | null => {
  if (!items?.length) return null;

  const counts: Record<BadgeKey, number> = {
    Dev: 0,
    New: 0,
    Mantenimiento: 0,
  };

  const walk = (nodes?: NavItem[]) => {
    nodes?.forEach((node) => {
      if (node.badge) {
        counts[resolveBadgeKey(node.badge)] += 1;
      }
      if (node.items?.length) walk(node.items);
    });
  };

  walk(items);

  const maxCount = Math.max(counts.New, counts.Mantenimiento, counts.Dev);
  if (maxCount === 0) return null;
  if (counts.New === maxCount) return "New";
  if (counts.Mantenimiento === maxCount) return "Mantenimiento";
  return "Dev";
};

/**
 * Componente recursivo para renderizar items de navegación
 * Soporta profundidad infinita usando SidebarMenuSub
 */
function NavRecursiveItem({
  item,
  level = 0,
  openGroups,
  onToggle,
  badgeSeenGroups,
  showInlineTooltips,
}: {
  item: NavItem;
  level?: number;
  openGroups: Record<string, boolean>;
  onToggle: (title: string, isOpen: boolean) => void;
  badgeSeenGroups: Record<string, boolean>;
  showInlineTooltips: boolean;
}) {
  const location = useLocation();
  // Active si la URL exacta coincide
  const isActive = location.pathname === item.url;

  // Auto-expand si algun hijo coincide con la ruta actual.
  const hasActiveChild = (items?: NavItem[]): boolean => {
    if (!items) return false;
    return items.some(
      (i) => i.url === location.pathname || hasActiveChild(i.items),
    );
  };

  // Prioridad: Estado persistido > Auto-expand por ruta activa.
  const isOpen = openGroups[item.title] ?? hasActiveChild(item.items);

  const hasSubItems = item.items && item.items.length > 0;
  const childBadgePriority = getBadgePriority(item.items);
  const showBadgeChevron =
    Boolean(childBadgePriority) && !isOpen && !badgeSeenGroups[item.title];

  // CASO 1: Item con submenú (Carpeta)
  if (hasSubItems) {
    return (
      <Collapsible
        asChild
        open={isOpen}
        onOpenChange={(open) => onToggle(item.title, open)}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isActive}>
              <span className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center">
                  {/* Ícono: Si es nivel 0 usa el ícono configurado, si no, usa Circle pequeño */}
                  {item.icon ? (
                    <item.icon />
                  ) : (
                    level > 0 && <Circle className="h-2 w-2" />
                  )}
                </span>
                {showInlineTooltips ? (
                  <TruncatedTooltip
                    label={item.title}
                    side="top"
                    align="start"
                    className={`min-w-0 ${TITLE_TEXT_CLASSES}`}
                  >
                    {item.title}
                  </TruncatedTooltip>
                ) : (
                  <span className={`min-w-0 ${TITLE_TEXT_CLASSES}`}>
                    {item.title}
                  </span>
                )}

                <span className="flex items-center gap-2">
                  {item.badge && renderBadge(item.badge, showInlineTooltips)}
                  <span className="flex items-center gap-1.5">
                    {showBadgeChevron && childBadgePriority && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          BADGE_DOT_STYLES[childBadgePriority],
                        )}
                      />
                    )}
                    <ChevronRight className="shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </span>
                </span>
              </span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <NavRecursiveItem
                  key={subItem.title}
                  item={subItem}
                  level={level + 1}
                  openGroups={openGroups}
                  onToggle={onToggle}
                  badgeSeenGroups={badgeSeenGroups}
                  showInlineTooltips={showInlineTooltips}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // CASO 2: Item hoja (Link)
  // Si estamos en nivel 0 (raíz), usamos SidebarMenuButton.
  // Si estamos en nivel > 0 (anidado), usamos SidebarMenuSubButton para correcta indentación.

  if (level === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link
            to={item.url || "#"}
            className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {item.icon && <item.icon />}
            </span>
            {showInlineTooltips ? (
              <TruncatedTooltip
                label={item.title}
                side="top"
                align="start"
                className={`min-w-0 ${TITLE_TEXT_CLASSES}`}
              >
                {item.title}
              </TruncatedTooltip>
            ) : (
              <span className={`min-w-0 ${TITLE_TEXT_CLASSES}`}>
                {item.title}
              </span>
            )}
            {item.badge && (
              <span className="flex items-center gap-2">
                {renderBadge(item.badge, showInlineTooltips)}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link
          to={item.url || "#"}
          className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
        >
          {showInlineTooltips ? (
            <TruncatedTooltip
              label={item.title}
              side="top"
              align="start"
              className={`min-w-0 ${TITLE_TEXT_CLASSES}`}
            >
              {item.title}
            </TruncatedTooltip>
          ) : (
            <span className={`min-w-0 ${TITLE_TEXT_CLASSES}`}>
              {item.title}
            </span>
          )}
          {item.badge && (
            <span className="flex items-center gap-2">
              {renderBadge(item.badge, showInlineTooltips)}
            </span>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export function NavMain({ sections }: NavMainProps) {
  // Usar el store global de Zustand para persistencia
  const { openGroups, toggleGroup, badgeSeenGroups } = useSidebarStore(
    useShallow((state) => ({
      openGroups: state.openGroups,
      toggleGroup: state.toggleGroup,
      badgeSeenGroups: state.badgeSeenGroups,
    })),
  );
  const { state } = useSidebar();
  const showInlineTooltips = state !== "collapsed";

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => (
              <NavRecursiveItem
                key={item.title}
                item={item}
                level={0}
                openGroups={openGroups}
                onToggle={toggleGroup}
                badgeSeenGroups={badgeSeenGroups}
                showInlineTooltips={showInlineTooltips}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
const BADGE_RING_STYLES: Record<BadgeKey, string> = {
  Dev: "ring-1 ring-inset ring-status-alert/20",
  New: "ring-1 ring-inset ring-status-info/20",
  Mantenimiento: "ring-1 ring-inset ring-status-critical/20",
};

const getBadgeRingClass = (badge: string) =>
  BADGE_RING_STYLES[resolveBadgeKey(badge)];
