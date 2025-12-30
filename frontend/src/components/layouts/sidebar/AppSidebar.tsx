/**
 * AppSidebar.tsx
 *
 * Componente principal del sidebar de SIRES.
 *
 * Arquitectura:
 * - Header: Logo SIRES
 * - Content: NavMain (secciones filtradas por permisos)
 * - Footer: NavSecondary (Support/Feedback) + NavUser
 * - Variante: "inset" (como sidebar-08 de shadcn)
 * - Collapsible: "offcanvas" (se cierra completamente)
 */

import * as React from "react";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sections, secondaryItems, isEmpty } = useNavigation();

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      {/* ===== HEADER: Logo SIRES ===== */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 pt-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-app">
            <img
              src="/icons/metro-logo-borde.svg"
              alt="SIRES Logo"
              className="h-7 w-7"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-display text-txt-body">SIRES</span>
            <span className="text-xs text-txt-body">STC Metro CDMX</span>
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
