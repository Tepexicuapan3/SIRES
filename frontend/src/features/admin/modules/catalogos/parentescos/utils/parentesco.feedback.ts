import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const PARENTESCO_ERROR_MESSAGES: Record<string, string> = {
  KINSHIP_NOT_FOUND: "El parentesco ya no existe o fue eliminado.",
  KINSHIP_EXISTS: "Ya existe un parentesco con ese codigo o nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getParentescoErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, PARENTESCO_ERROR_MESSAGES);
};
