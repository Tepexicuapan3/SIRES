import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const TIPO_PERSONAL_ERROR_MESSAGES: Record<string, string> = {
  PERSONAL_TYPE_NOT_FOUND: "El tipo de personal ya no existe o fue eliminado.",
  PERSONAL_TYPE_EXISTS: "Ya existe un tipo de personal con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getTipoPersonalErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, TIPO_PERSONAL_ERROR_MESSAGES);
};
