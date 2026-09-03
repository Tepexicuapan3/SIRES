import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const RELIGION_ERROR_MESSAGES: Record<string, string> = {
  RELIGION_NOT_FOUND: "La religion ya no existe o fue eliminada.",
  RELIGION_EXISTS: "Ya existe una religion con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getReligionErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, RELIGION_ERROR_MESSAGES);
};
