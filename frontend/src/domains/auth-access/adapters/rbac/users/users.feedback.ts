import { resolveApiErrorMessage } from "@/domains/auth-access/adapters/rbac/shared/rbac-feedback";

const USER_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "El usuario ya no existe o fue eliminado.",
  USER_EXISTS: "El usuario o el correo ya estan registrados.",
  ROLE_NOT_FOUND: "El rol seleccionado no existe o fue removido.",
  CLINIC_NOT_FOUND: "El centro de atencion seleccionado no existe.",
  CANNOT_REMOVE_LAST_ROLE: "El usuario debe conservar al menos un rol activo.",
  PERMISSION_NOT_FOUND:
    "El permiso seleccionado no existe o ya no esta disponible.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getUserErrorMessage = (error: unknown, fallback: string) => {
  return resolveApiErrorMessage(error, fallback, USER_ERROR_MESSAGES);
};
