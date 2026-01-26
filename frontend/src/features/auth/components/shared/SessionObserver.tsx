import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { clearAuthSession } from "@features/auth/utils/auth-cache";
import { subscribeSessionExpired } from "@features/auth/utils/session-events";
import { queryClient } from "@/config/query-client";

/**
 * Componente lógico (sin UI) que observa el estado de la sesión.
 *
 * Responsabilidad:
 * Escuchar el flag `isSessionExpired` del store (activado por Axios en client.ts)
 * y ejecutar la redirección suave usando hooks de React Router.
 */
export const SessionObserver = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      // 1. Notificar al usuario
      toast.error("Tu sesión ha expirado. Por favor ingresa nuevamente.");

      // 2. Navegación suave (sin recargar la página)
      navigate("/login", { replace: true });

      // 3. Limpieza defensiva de la sesión cacheada
      clearAuthSession(queryClient);
    };

    return subscribeSessionExpired(handleSessionExpired);
  }, [navigate]);

  return null;
};
