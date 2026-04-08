/**
 * NavSecondary.tsx
 *
 * Navegación secundaria (Support, Feedback, etc.)
 * Va en el footer del sidebar, arriba del NavUser.
 */

import { Link, useLocation } from "react-router-dom";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@shared/ui/sidebar";
import type { NavItem } from "@app/navigation/nav-config";

interface NavSecondaryProps {
  items: NavItem[];
}

export function NavSecondary({ items }: NavSecondaryProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            const href = item.url ?? "#";

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link to={href} className="flex min-w-0 items-center gap-2">
                    {item.icon && <item.icon />}
                    <span className="min-w-0 flex-1 truncate">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
