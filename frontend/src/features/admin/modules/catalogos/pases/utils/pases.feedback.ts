import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const PASES_ERROR_MESSAGES: Record<string, string> = {
  PASS_NOT_FOUND: "El pase ya no existe o fue eliminado.",
  PASS_EXISTS: "Ya existe un pase con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getPaseErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, PASES_ERROR_MESSAGES);
};
