import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const TIPOS_SANGUINEO_ERROR_MESSAGES: Record<string, string> = {
  BLOOD_TYPE_NOT_FOUND: "El tipo sanguineo ya no existe o fue eliminado.",
  BLOOD_TYPE_EXISTS: "Ya existe un tipo sanguineo con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getTipoSanguineoErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, TIPOS_SANGUINEO_ERROR_MESSAGES);
};
