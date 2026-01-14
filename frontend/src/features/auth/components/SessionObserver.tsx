import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

/**
 * Componente lógico (sin UI) que observa el estado de la sesión.
 *
 * Responsabilidad:
 * Escuchar el flag `isSessionExpired` del store (activado por Axios en client.ts)
 * y ejecutar la redirección suave usando hooks de React Router.
 */
export const SessionObserver = () => {
  const navigate = useNavigate();
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired);
  const setSessionExpired = useAuthStore((state) => state.setSessionExpired);

  useEffect(() => {
    if (isSessionExpired) {
      // 1. Notificar al usuario
      toast.error("Tu sesión ha expirado. Por favor ingresa nuevamente.");

      // 2. Navegación suave (sin recargar la página)
      navigate("/login", { replace: true });

      // 3. Resetear el flag inmediatamente para no bloquear futuros intentos
      // o causar bucles si el componente se remonta.
      setSessionExpired(false);
    }
  }, [isSessionExpired, navigate, setSessionExpired]);

  return null; // No renderiza nada visualmente
};
