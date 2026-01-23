/**
 * MainLayout.tsx
 *
 * Layout principal de la aplicación con sidebar.
 *
 * Arquitectura:
 * - SidebarProvider: Contexto para manejar estado del sidebar
 * - AppSidebar: Navegación lateral con menús filtrados por RBAC
 * - Main: Área de contenido con breadcrumbs y outlet
 * - Breadcrumbs: Navegación jerárquica generada desde la ruta actual
 */

import { Outlet } from "react-router-dom";
import { Suspense } from "react";

import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";
import { SkipToContent } from "@/components/shared/SkipToContent";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/sidebar";
import { MainHeader } from "@/components/layouts/header/MainHeader";

export const MainLayout = () => {
  return (
    <SidebarProvider>
      {/* Skip link para accesibilidad de teclado */}
      <SkipToContent />

      {/* Barra de progreso invisible que se activa al navegar */}
      <NavigationProgressBar />

      {/* Sidebar con navegación RBAC */}
      <AppSidebar />

      {/* Main Content Area - usa SidebarInset para el spacing correcto */}
      <SidebarInset>
        <MainHeader />

        {/* Page Content */}
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-auto overflow-x-hidden p-4 sm:p-6"
          data-main-content
        >
          {/* Suspense sin spinner para evitar conflicto visual con la barra de progreso superior */}
          <Suspense fallback={<div className="w-full h-full min-h-[200px]" />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
