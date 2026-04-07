import { Outlet } from "react-router-dom";
import { SessionObserver } from "@/domains/auth-access/components/shared/SessionObserver";
import { useAuthSession } from "@/domains/auth-access/hooks/useAuthSession";
import { NavigationProgressBar } from "@shared/components/NavigationProgressBar";

/**
 * Layout raíz de la aplicación.
 *
 * Propósito:
 * - Renderizar componentes lógicos globales (como SessionObserver)
 * - Proveer un punto de entrada común para todas las rutas
 *
 * No tiene UI visual propia, solo lógica y Outlet.
 */
export const RootLayout = () => {
  // Hidratacion global de sesion para evitar estado obsoleto en rutas publicas.
  useAuthSession();

  return (
    <>
      <NavigationProgressBar />
      <SessionObserver />
      <Outlet />
    </>
  );
};
