import { Navigate, Outlet } from "react-router-dom";

import { isAuthenticated } from "@/api/authStore";

/**
 * Guard simple: sin token en sessionStorage, no hay nada que verificar
 * contra el backend (no hay endpoint de "whoami" en esta fase) — si hay
 * token se asume válido y se deja pasar; si el token venció, el cliente
 * HTTP (`@/api/client.ts`) intercepta el 401 de la primera request real y
 * redirige a /login desde ahí.
 */
export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
