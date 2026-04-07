import { resolveApiErrorMessage } from "@/domains/auth-access/adapters/rbac/shared/rbac-feedback";

const ROLE_ERROR_MESSAGES: Record<string, string> = {
  ROLE_NOT_FOUND: "El rol ya no existe o fue eliminado.",
  ROLE_EXISTS: "Ya existe un rol con ese nombre.",
  ROLE_SYSTEM_PROTECTED: "Los roles de sistema solo permiten lectura.",
  CANNOT_DELETE_SYSTEM_ROLE: "Los roles de sistema no se pueden eliminar.",
  ROLE_HAS_USERS: "No puedes eliminar un rol con usuarios activos asignados.",
  PERMISSION_DEPENDENCY:
    "No puedes revocar :read mientras existan permisos de escritura del mismo recurso.",
  PERMISSION_NOT_FOUND: "El permiso seleccionado no existe o fue removido.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getRoleErrorMessage = (error: unknown, fallback: string) => {
  return resolveApiErrorMessage(error, fallback, ROLE_ERROR_MESSAGES);
};
