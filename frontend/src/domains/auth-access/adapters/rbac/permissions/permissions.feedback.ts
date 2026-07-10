import { resolveApiErrorMessage } from "@/domains/auth-access/adapters/rbac/shared/rbac-feedback";

const PERMISSION_ERROR_MESSAGES: Record<string, string> = {
  PERMISSIONS_EXISTS: "Ya existe un permiso con ese codigo o descripcion.",
  VALIDATION_ERROR: "Revisa el formato del codigo antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para crear permisos.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getPermissionErrorMessage = (error: unknown, fallback: string) => {
  return resolveApiErrorMessage(error, fallback, PERMISSION_ERROR_MESSAGES);
};
