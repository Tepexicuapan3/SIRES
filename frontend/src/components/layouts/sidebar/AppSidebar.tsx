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
        <div className="flex min-w-0 items-center gap-3 pl-4 pr-2 pt-3">
          <div className="flex h-12 w-12 items-center justify-center">
            <img
              src="/SIRES.webp"
              alt="Logo SIRES"
              className="h-11 w-11 object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-md font-display text-txt-body">
              SIRES
            </span>
            <span className="truncate text-xs text-txt-muted">
              STC Metro CDMX
            </span>
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
