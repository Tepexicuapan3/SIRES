import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ESTUDIOS_ERROR_MESSAGES: Record<string, string> = {
  STUDY_NOT_FOUND: "El estudio ya no existe o fue eliminado.",
  STUDY_EXISTS: "Ya existe un estudio con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getEstudioErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, ESTUDIOS_ERROR_MESSAGES);
};
