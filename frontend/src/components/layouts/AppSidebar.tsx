/**
 * ============================================
 * APP SIDEBAR - Navegación RBAC (sidebar-08)
 * ============================================
 *
 * Basado en shadcn/ui sidebar-08 block.
 * Adaptado a Metro CDMX + RBAC 2.0.
 */

import { Command } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain, type NavMainItem } from "@/components/layouts/nav-main";
import { NavSecondary } from "@/components/layouts/nav-secondary";
import { NavUser } from "@/components/layouts/nav-user";

import { usePermissions } from "@features/auth/hooks/usePermissions";
import { navigationConfig, secondaryNavConfig } from "@/config/navigation";

/**
 * Hook para filtrar navegación según permisos RBAC
 */
const useFilteredNavigation = () => {
  const { hasPermission, isAdmin } = usePermissions();

  const filterMainItems = (items: NavMainItem[]): NavMainItem[] => {
    return items
      .filter((item) => {
        if (!item.permission) return true;
        if (item.permission === "requireAdmin") return isAdmin();
        return hasPermission(item.permission);
      })
      .map((item) => ({
        ...item,
        items: item.items?.filter((sub) => {
          if (!sub.permission) return true;
          if (sub.permission === "requireAdmin") return isAdmin();
          return hasPermission(sub.permission);
        }),
      }));
  };

  const filterSecondary = (items: typeof secondaryNavConfig) => {
    return items.filter((item) => {
      if (!item.permission) return true;
      if (item.permission === "requireAdmin") return isAdmin();
      return hasPermission(item.permission);
    });
  };

  return {
    navMain: filterMainItems(navigationConfig),
    navSecondary: filterSecondary(secondaryNavConfig),
  };
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { navMain, navSecondary } = useFilteredNavigation();

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header con logo Metro CDMX */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-txt-inverse">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SIRES</span>
                  <span className="truncate text-xs">Metro CDMX</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contenido: navegación principal + secundaria */}
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* Footer: usuario */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
