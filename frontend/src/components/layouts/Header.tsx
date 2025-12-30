/**
 * ============================================
 * HEADER COMPONENT - DEPRECADO
 * ============================================
 *
 * @deprecated Este componente está deprecado.
 * La funcionalidad de header ahora vive en MainLayout.tsx
 * con sidebar-08 integrado.
 *
 * TODO: Eliminar este archivo después de confirmar que no se usa.
 */

import { useLocation } from "react-router-dom";

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
 * Componente Header (DEPRECADO)
 */
export const Header = () => {
  const pageTitle = usePageTitle();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line-hairline bg-paper px-4 sm:px-6">
      {/* Título de la página */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-txt-body sm:text-xl">
          {pageTitle}
        </h1>
      </div>
    </header>
  );
};
