/**
 * ============================================
 * HEADER COMPONENT - Barra superior
 * ============================================
 *
 * Header minimalista con:
 * - Trigger del sidebar (mobile/desktop)
 * - Breadcrumb/título de la página actual
 * - (Opcional) acciones rápidas
 */

import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Mapeo de rutas a títulos legibles
 */
const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/consultas": "Consultas Médicas",
  "/admin": "Administración",
  "/admin/permisos": "Gestión de Permisos",
  "/admin/usuarios": "Gestión de Usuarios",
  "/admin/usuarios/nuevo": "Crear Nuevo Usuario",
};

/**
 * Hook para obtener el título de la página actual
 */
const usePageTitle = () => {
  const location = useLocation();
  return routeTitles[location.pathname] || "SIRES";
};

/**
 * Componente Header
 */
export const Header = () => {
  const pageTitle = usePageTitle();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line-hairline bg-paper px-4 sm:px-6">
      {/* Trigger para mobile/desktop */}
      <SidebarTrigger />

      {/* Título de la página */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-txt-body sm:text-xl">
          {pageTitle}
        </h1>
      </div>

      {/* Espacio para acciones futuras (notificaciones, búsqueda, etc.) */}
      <div className="flex items-center gap-2">
        {/* Aquí pueden ir botones de acciones rápidas */}
      </div>
    </header>
  );
};
