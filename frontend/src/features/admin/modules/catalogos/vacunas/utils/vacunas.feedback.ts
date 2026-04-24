import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const VACUNAS_ERROR_MESSAGES: Record<string, string> = {
  VACCINE_NOT_FOUND: "La vacuna ya no existe o fue eliminada.",
  VACCINE_EXISTS: "Ya existe una vacuna con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getVacunaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, VACUNAS_ERROR_MESSAGES);
};
