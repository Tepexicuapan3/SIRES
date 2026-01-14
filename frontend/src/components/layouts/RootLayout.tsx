import { Outlet } from "react-router-dom";
import { SessionObserver } from "@/features/auth/components/SessionObserver";

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
  return (
    <>
      <SessionObserver />
      <Outlet />
    </>
  );
};
