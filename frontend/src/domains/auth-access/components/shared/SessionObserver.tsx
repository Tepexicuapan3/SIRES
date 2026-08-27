import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { queryClient } from "@app/config/query-client";

import { clearAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { subscribeSessionExpired } from "@/domains/auth-access/adapters/session-events";
import { authKeys } from "@/domains/auth-access/state/auth.keys";

// Intervalo del heartbeat. Debe ser menor al TTL de sesion activa del
// backend (ACTIVE_SESSION_TTL_SECONDS, default 30 min) para que el "sigo
// vivo" llegue antes de que Redis libere el slot por inactividad.
const SESSION_HEARTBEAT_INTERVAL_MS = 60_000;

// Eventos que cuentan como "el usuario sigue ahi". Si no hay ninguno de
// estos dentro de la ventana del heartbeat, se deja de renovar el TTL a
// proposito para que la sesion expire por inactividad real (no solo por
// tener la pestaña abierta).
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

export const SessionObserver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());

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
    // Heartbeat: mantiene viva la sesion activa (control de sesion unica),
    // pero SOLO si hubo actividad real del usuario en la ultima ventana.
    // Si el usuario deja la pestaña abierta sin tocar nada, dejamos de
    // renovar el TTL a proposito para que la sesion expire por inactividad
    // real (antes solo se liberaba cerrando la pestaña o apagando el equipo).
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true }),
    );

    const interval = setInterval(() => {
      const user = queryClient.getQueryData(authKeys.session());
      if (!user) return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor > SESSION_HEARTBEAT_INTERVAL_MS) return;
      void authAPI.verifyToken();
    }, SESSION_HEARTBEAT_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActivity),
      );
      clearInterval(interval);
    };
  }, []);

  return null;
};
