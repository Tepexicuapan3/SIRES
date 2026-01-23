import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarBreadcrumbs } from "@/components/layouts/header/SidebarBreadcrumbs";
import { ModuleSearch } from "@/components/layouts/header/ModuleSearch";

/**
 * Header principal del layout.
 *
 * Razon industria:
 * - Centraliza acciones de navegacion (breadcrumbs + buscador).
 * - Mantiene el layout limpio y permite evolucionar el header sin tocar el layout.
 */
export const MainHeader = () => {
  return (
    <header
      role="banner"
      className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-line-hairline bg-app/95 backdrop-blur-sm px-4"
    >
      <SidebarTrigger
        className="-ml-1"
        aria-label="Abrir/cerrar menú de navegación"
      />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <SidebarBreadcrumbs />
      <ModuleSearch />
    </header>
  );
};
