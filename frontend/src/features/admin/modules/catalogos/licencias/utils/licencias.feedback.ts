import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const LICENCIA_ERROR_MESSAGES: Record<string, string> = {
  LICENSE_NOT_FOUND: "La licencia ya no existe o fue eliminada.",
  LICENSE_EXISTS: "Ya existe una licencia con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getLicenciaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, LICENCIA_ERROR_MESSAGES);
};
