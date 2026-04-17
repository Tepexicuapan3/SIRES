import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const CENTROS_ERROR_MESSAGES: Record<string, string> = {
  CARE_CENTER_NOT_FOUND: "El centro ya no existe o fue eliminado.",
  CARE_CENTER_EXISTS: "Ya existe un centro con ese nombre o CLUES.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getCentroAtencionErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  return getCatalogErrorMessage(error, fallback, CENTROS_ERROR_MESSAGES);
};