/**
 * NavMain.tsx
 *
 * Componente que renderiza las secciones principales de navegación.
 *
 * Características:
 * - Collapsible sections por rol (ADMINISTRADOR, MÉDICO, etc.)
 * - Subitems con navegación
 * - Active state según la ruta actual
 * - Adaptado a tokens Metro CDMX
 */

import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { NavSection } from "./nav-config";

interface NavMainProps {
  /** Secciones filtradas por useNavigation */
  sections: NavSection[];
}

export function NavMain({ sections }: NavMainProps) {
  const location = useLocation();

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              const isActive = location.pathname === item.url;
              const hasSubItems = item.items && item.items.length > 0;

              return (
                <Collapsible key={item.title} asChild defaultOpen={isActive}>
                  <SidebarMenuItem>
                    {hasSubItems ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={isActive}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto text-xs bg-status-info text-white px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => {
                              const isSubActive =
                                location.pathname === subItem.url;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                  >
                                    <Link to={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-xs bg-status-info text-white px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
