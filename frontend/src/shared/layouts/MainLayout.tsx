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

import { SkipToContent } from "@shared/components/SkipToContent";
import { SidebarProvider, SidebarInset } from "@shared/ui/sidebar";
import { AppSidebar } from "@shared/layouts/sidebar";
import { MainHeader } from "@shared/layouts/header/MainHeader";

export const MainLayout = () => {
  return (
    <SidebarProvider>
      {/* Skip link para accesibilidad de teclado */}
      <SkipToContent />

      {/* Sidebar con navegación RBAC */}
      <AppSidebar />

      {/* Main Content Area - usa SidebarInset para el spacing correcto */}
      <SidebarInset>
        <div className="flex min-h-svh flex-col bg-sidebar">
          <div className="sticky top-0 z-[90] rounded-t-3xl bg-sidebar px-2 pt-2 md:px-3 md:pt-3">
            <div className="rounded-t-3xl bg-app">
              <MainHeader />
            </div>
          </div>

          <div className="flex flex-1 px-2 pb-2 md:px-3 md:pb-3">
            <div className="flex w-full min-h-full flex-col rounded-b-3xl bg-app">
              {/* Page Content */}
              <main
                id="main-content"
                role="main"
                className="flex-1 overflow-x-auto p-4 sm:p-6"
                data-main-content
              >
                {/* Suspense sin spinner para evitar conflicto visual con la barra de progreso superior */}
                <Suspense
                  fallback={
                    <div className="flex min-h-50 w-full flex-col gap-4">
                      <div className="h-6 w-40 rounded-md bg-subtle animate-pulse" />
                      <div className="h-4 w-2/3 rounded-md bg-subtle animate-pulse" />
                      <div className="h-4 w-1/2 rounded-md bg-subtle animate-pulse" />
                      <div className="h-64 w-full rounded-lg bg-subtle animate-pulse" />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
