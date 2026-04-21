import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ESCOLARIDAD_ERROR_MESSAGES: Record<string, string> = {
  EDUCATION_LEVEL_NOT_FOUND: "El nivel de escolaridad ya no existe o fue eliminado.",
  EDUCATION_LEVEL_EXISTS: "Ya existe un nivel de escolaridad con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getEscolaridadErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, ESCOLARIDAD_ERROR_MESSAGES);
};
