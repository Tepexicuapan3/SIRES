import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { queryClient } from "@app/config/query-client";

import { clearAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { subscribeSessionExpired } from "@/domains/auth-access/adapters/session-events";
import { authKeys } from "@/domains/auth-access/state/auth.keys";

// Debe ser menor al TTL de sesion activa en el backend (120s) para que el
// "sigo vivo" llegue antes de que Redis libere el slot por inactividad.
const SESSION_HEARTBEAT_INTERVAL_MS = 60_000;

export const SessionObserver = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleSessionExpired = () => {
      const isAlreadyOnLogin = location.pathname === "/login";

      clearAuthSession(queryClient);

      if (!isAlreadyOnLogin) {
        toast.error("Tu sesión ha expirado. Por favor ingresa nuevamente.");
      }

      if (!isAlreadyOnLogin) {
        navigate("/login", { replace: true });
      }
    };

    return subscribeSessionExpired(handleSessionExpired);
  }, [location.pathname, navigate]);

  useEffect(() => {
    // Heartbeat: mantiene viva la sesion activa (control de sesion unica).
    // Si el usuario cierra la pestaña o apaga el equipo, este interval deja
    // de correr y el backend libera la sesion solo cuando vence el TTL.
    const interval = setInterval(() => {
      const user = queryClient.getQueryData(authKeys.session());
      if (!user) return;
      void authAPI.verifyToken();
    }, SESSION_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
};
