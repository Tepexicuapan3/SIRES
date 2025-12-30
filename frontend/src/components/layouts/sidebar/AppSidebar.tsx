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
    <Sidebar
      variant="inset"
      collapsible="offcanvas"
      {...props}
      aria-label="Menú de navegación principal"
    >
      {/* ===== HEADER: Logo SIRES ===== */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 pt-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper">
            <svg
              viewBox="0 0 100 100"
              className="h-7 w-7 text-txt-body"
              fill="currentColor"
              role="img"
              aria-label="Logo Metro CDMX"
            >
              <title>Logo Metro CDMX</title>
              {/* Logo Metro CDMX - M estilizada con círculo */}
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                d="M25 70 L25 35 L50 55 L75 35 L75 70 L65 70 L65 50 L50 65 L35 50 L35 70 Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-display text-txt-body">SIRES</span>
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
