import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const TIPOS_AREAS_ERROR_MESSAGES: Record<string, string> = {
  AREA_TYPE_NOT_FOUND: "El tipo de area ya no existe o fue eliminado.",
  AREA_TYPE_EXISTS: "Ya existe un tipo de area con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getTipoAreaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, TIPOS_AREAS_ERROR_MESSAGES);
};
