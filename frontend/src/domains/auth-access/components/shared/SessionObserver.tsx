import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { queryClient } from "@app/config/query-client";

import { clearAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { subscribeSessionExpired } from "@/domains/auth-access/adapters/session-events";

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

  return null;
};
