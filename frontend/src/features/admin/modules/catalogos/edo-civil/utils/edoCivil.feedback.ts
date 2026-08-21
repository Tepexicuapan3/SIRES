import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const EDO_CIVIL_ERROR_MESSAGES: Record<string, string> = {
  CIVIL_STATUS_NOT_FOUND: "El estado civil ya no existe o fue eliminado.",
  CIVIL_STATUS_EXISTS: "Ya existe un estado civil con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getEdoCivilErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, EDO_CIVIL_ERROR_MESSAGES);
};
