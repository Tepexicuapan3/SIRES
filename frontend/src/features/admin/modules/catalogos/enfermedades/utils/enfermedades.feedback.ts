import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ENFERMEDADES_ERROR_MESSAGES: Record<string, string> = {
  DISEASE_NOT_FOUND: "La enfermedad ya no existe o fue eliminada.",
  DISEASE_EXISTS: "Ya existe una enfermedad con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getEnfermedadErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, ENFERMEDADES_ERROR_MESSAGES);
};
