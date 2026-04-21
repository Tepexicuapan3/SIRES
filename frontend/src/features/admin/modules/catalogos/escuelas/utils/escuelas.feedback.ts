import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ESCUELAS_ERROR_MESSAGES: Record<string, string> = {
  SCHOOL_NOT_FOUND: "La escuela ya no existe o fue eliminada.",
  SCHOOL_EXISTS: "Ya existe una escuela con ese nombre o codigo.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getEscuelaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, ESCUELAS_ERROR_MESSAGES);
};
