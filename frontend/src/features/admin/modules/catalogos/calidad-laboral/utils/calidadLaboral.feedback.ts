import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const CALIDAD_LABORAL_ERROR_MESSAGES: Record<string, string> = {
  LABOR_QUALITY_NOT_FOUND: "La calidad laboral ya no existe o fue eliminada.",
  LABOR_QUALITY_EXISTS: "Ya existe una calidad laboral con ese codigo o nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getCalidadLaboralErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, CALIDAD_LABORAL_ERROR_MESSAGES);
};
