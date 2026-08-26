import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const BAJAS_ERROR_MESSAGES: Record<string, string> = {
  DISCHARGE_REASON_NOT_FOUND: "La baja ya no existe o fue eliminada.",
  DISCHARGE_REASON_EXISTS: "Ya existe una baja con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getBajaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, BAJAS_ERROR_MESSAGES);
};
