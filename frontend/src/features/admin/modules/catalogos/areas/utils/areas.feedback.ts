import { ApiError } from "@api/utils/errors";

const AREA_ERROR_MESSAGES: Record<string, string> = {
  AREA_NOT_FOUND: "El area ya no existe o fue eliminada.",
  AREA_EXISTS: "Ya existe un area con ese nombre o codigo.",
  AREA_CODE_EXISTS: "El codigo ya esta en uso por otra area.",
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

export const getAreaErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    const mappedMessage = AREA_ERROR_MESSAGES[error.code];
    const baseMessage = mappedMessage || error.message || fallback;
    return `${baseMessage}${formatDetails(error.details)}`;
  }

  return fallback;
};
