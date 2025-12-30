/**
 * ============================================
 * MAIN LAYOUT - Estructura sidebar-08
 * ============================================
 *
 * Layout principal basado en shadcn sidebar-08.
 * Incluye breadcrumbs dinámicos + RBAC.
 */

import { Outlet, useLocation, Link } from "react-router-dom";
import { Suspense } from "react";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";

/**
 * Hook para generar breadcrumbs desde URL
 */
const useBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return [{ title: "Dashboard", href: "/dashboard", isLast: true }];
  }

  return pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const title =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const isLast = index === pathSegments.length - 1;

    return { title, href, isLast };
  });
};

export function MainLayout() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <SidebarProvider defaultOpen={true}>
      <NavigationProgressBar />

      {/* Sidebar con RBAC */}
      <AppSidebar />

      {/* Contenido principal con breadcrumbs */}
      <SidebarInset>
        {/* Header fijo con breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line-hairline bg-paper transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="contents">
                    {index > 0 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                    <BreadcrumbItem
                      className={index === 0 ? "hidden md:block" : ""}
                    >
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.href}>{crumb.title}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Área de contenido scrollable */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
