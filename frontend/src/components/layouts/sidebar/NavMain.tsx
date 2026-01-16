/**
 * NavMain.tsx
 *
 * Componente que renderiza las secciones principales de navegación.
 * Implementa renderizado recursivo para soportar N niveles de anidamiento.
 * Persistencia de estado de menús abiertos vía Zustand.
 */

import { ChevronRight, Circle } from "lucide-react";
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
import { useSidebarStore } from "@/store/sidebarStore";
import type { NavSection, NavItem } from "./nav-config";

interface NavMainProps {
  sections: NavSection[];
}

/**
 * Componente recursivo para renderizar items de navegación
 * Soporta profundidad infinita usando SidebarMenuSub
 */
function NavRecursiveItem({ 
  item, 
  level = 0,
  openGroups,
  onToggle
}: { 
  item: NavItem; 
  level?: number;
  openGroups: Record<string, boolean>;
  onToggle: (title: string, isOpen: boolean) => void;
}) {
  const location = useLocation();
  // Active si la URL exacta coincide
  const isActive = location.pathname === item.url;
  
  // Calcular si algún hijo está activo (para auto-expand inicial si no hay estado)
  const hasActiveChild = (items?: NavItem[]): boolean => {
    if (!items) return false;
    return items.some(
      (i) => i.url === location.pathname || hasActiveChild(i.items)
    );
  };
  
  // Prioridad: Estado persistido > Auto-expand por ruta activa
  const isOpen = openGroups[item.title] ?? hasActiveChild(item.items);

  const hasSubItems = item.items && item.items.length > 0;

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
              {/* Ícono: Si es nivel 0 usa el ícono configurado, si no, usa Circle pequeño */}
              {item.icon ? <item.icon /> : level > 0 && <Circle className="h-2 w-2" />}
              <span>{item.title}</span>
              
              {/* Badge */}
              {item.badge && (
                <span className="ml-auto text-xs bg-status-info text-white px-2 py-0.5 rounded-full mr-2">
                  {item.badge}
                </span>
              )}
              
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
          <Link to={item.url || "#"}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto text-xs bg-status-info text-white px-2 py-0.5 rounded-full">
                {item.badge}
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
        <Link to={item.url || "#"}>
          <span>{item.title}</span>
          {item.badge && (
            <span className="ml-auto text-xs bg-status-info text-white px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export function NavMain({ sections }: NavMainProps) {
  // Usar el store global de Zustand para persistencia
  const { openGroups, toggleGroup } = useSidebarStore();

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
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
