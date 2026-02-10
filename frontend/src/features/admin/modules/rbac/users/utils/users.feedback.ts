import { ApiError } from "@api/utils/errors";

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

const formatDetails = (details?: Record<string, string[]>) => {
  if (!details) return "";

  const lines = Object.entries(details)
    .flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    )
    .filter(Boolean);

  if (lines.length === 0) return "";
  return ` ${lines.join(" | ")}`;
};

export const getUserErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const mappedMessage = USER_ERROR_MESSAGES[error.code];
    const baseMessage = mappedMessage || error.message || fallback;
    return `${baseMessage}${formatDetails(error.details)}`;
  }

  return fallback;
};
