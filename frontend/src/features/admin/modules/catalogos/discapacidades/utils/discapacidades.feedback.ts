import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const DISCAPACIDADES_ERROR_MESSAGES: Record<string, string> = {
  DISABILITY_NOT_FOUND: "La discapacidad ya no existe o fue eliminada.",
  DISABILITY_EXISTS: "Ya existe una discapacidad con ese nombre o clave.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getDiscapacidadErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, DISCAPACIDADES_ERROR_MESSAGES);
};
