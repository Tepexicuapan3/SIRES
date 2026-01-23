/**
 * AppSidebar.tsx
 *
 * Componente principal del sidebar de SIRES.
 *
 * Arquitectura:
 * - Header: Logo SIRES
 * - Content: NavMain (secciones filtradas por permisos)
 * - Footer: NavSecondary (Support/Feedback) + NavUser
 * - Variante: "inset" 
 * - Collapsible: "offcanvas" (se cierra completamente)
 */

import type { ComponentProps } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import { NavSecondary } from "./NavSecondary";
import { NavUser } from "./NavUser";
import { useNavigation } from "@features/navigation/hooks/useNavigation";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { sections, secondaryItems, isEmpty } = useNavigation();

  return (
    <Sidebar
      variant="inset"
      collapsible="offcanvas"
      {...props}
      aria-label="Menú de navegación principal"
    >
      {/* ===== HEADER: Logo SIRES ===== */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 pt-3">
          <div className="flex h-10 w-10 items-center justify-center">
            <img
              src="/icons/Logo_del_Metro_de_la_Ciudad_de_México.svg"
              alt="Logo Metro CDMX"
              className="h-9 w-9"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-md font-display text-txt-body">SIRES</span>
            <span className="text-xs text-txt-muted">STC Metro CDMX</span>
          </div>
        </div>
      </SidebarHeader>

      {/* ===== CONTENT: Navegación Principal ===== */}
      <SidebarContent>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm text-txt-muted">No hay menús disponibles</p>
          </div>
        ) : (
          <NavMain sections={sections} />
        )}
      </SidebarContent>

      {/* ===== FOOTER: Support + User ===== */}
      <SidebarFooter>
        <NavSecondary items={secondaryItems} />
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
