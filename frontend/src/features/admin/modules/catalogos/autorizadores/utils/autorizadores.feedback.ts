import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const AUTORIZADOR_ERROR_MESSAGES: Record<string, string> = {
  AUTHORIZER_NOT_FOUND: "El autorizador ya no existe o fue eliminado.",
  AUTHORIZER_STUDIES_EXISTS: "Ya existe un autorizador con esos datos.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getAutorizadorErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, AUTORIZADOR_ERROR_MESSAGES);
};
