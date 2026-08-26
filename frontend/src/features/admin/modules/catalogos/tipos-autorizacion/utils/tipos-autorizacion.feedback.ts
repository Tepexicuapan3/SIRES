import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const TIPOS_AUTORIZACION_ERROR_MESSAGES: Record<string, string> = {
  AUTH_TYPE_NOT_FOUND: "El tipo de autorizacion ya no existe o fue eliminado.",
  AUTH_TYPE_STUDIES_EXISTS: "Ya existe un tipo de autorizacion con ese nombre o codigo.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getTipoAutorizacionErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, TIPOS_AUTORIZACION_ERROR_MESSAGES);
};
