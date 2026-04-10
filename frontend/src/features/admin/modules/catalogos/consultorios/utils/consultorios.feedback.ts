import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const CONSULTORIO_ERROR_MESSAGES: Record<string, string> = {
  CONSULTING_ROOM_NOT_FOUND: "El consultorio ya no existe o fue eliminado.",
  CONSULTING_ROOM_EXISTS: "Ya existe un consultorio con ese nombre o codigo.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getConsultorioErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  return getCatalogErrorMessage(error, fallback, CONSULTORIO_ERROR_MESSAGES);
};
