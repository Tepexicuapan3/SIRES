import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const AREA_ERROR_MESSAGES: Record<string, string> = {
  AREA_NOT_FOUND: "El area ya no existe o fue eliminada.",
  AREA_EXISTS: "Ya existe un area con ese nombre o codigo.",
  AREA_CODE_EXISTS: "El codigo ya esta en uso por otra area.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getAreaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, AREA_ERROR_MESSAGES);
};
