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

import { Outlet, useLocation, Link } from "react-router-dom";
import { Suspense } from "react";

import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SkipToContent } from "@/components/shared/SkipToContent";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./sidebar";

/**
 * Genera breadcrumbs desde la ruta actual.
 *
 * Ejemplo:
 * /admin/users → ["Admin", "Usuarios"]
 * /consultas/nueva → ["Consultas", "Nueva Consulta"]
 */
function useBreadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return [];
  }

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);

    return { path, label };
  });

  return breadcrumbs;
}

export const MainLayout = () => {
  const breadcrumbs = useBreadcrumbs();

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
        {/* Header con trigger del sidebar + breadcrumbs - Sticky para acceso rápido */}
        <header
          role="banner"
          className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-line-hairline bg-app/95 backdrop-blur-sm px-4"
        >
          <SidebarTrigger
            className="-ml-1"
            aria-label="Abrir/cerrar menú de navegación"
          />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <span key={crumb.path} className="flex items-center gap-2">
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage aria-current="page">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-auto p-4 sm:p-6"
          data-main-content
        >
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
