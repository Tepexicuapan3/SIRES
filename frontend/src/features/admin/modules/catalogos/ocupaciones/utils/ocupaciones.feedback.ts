import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const OCUPACION_ERROR_MESSAGES: Record<string, string> = {
  OCCUPATIONS_NOT_FOUND: "La ocupacion ya no existe o fue eliminada.",
  OCCUPATIONS_EXISTS: "Ya existe una ocupacion con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getOcupacionErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, OCUPACION_ERROR_MESSAGES);
};
