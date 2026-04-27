import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const AREAS_CLINICAS_ERROR_MESSAGES: Record<string, string> = {
  CLINICAL_AREA_NOT_FOUND: "El área clínica ya no existe o fue eliminada.",
  CLINICAL_AREA_EXISTS: "Ya existe un área clínica con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getAreaClinicaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, AREAS_CLINICAS_ERROR_MESSAGES);
};
