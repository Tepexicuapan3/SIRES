import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const SUCURSAL_ERROR_MESSAGES: Record<string, string> = {
  BRANCH_NOT_FOUND: "La sucursal ya no existe o fue eliminada.",
  BRANCH_EXISTS: "Ya existe una sucursal con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getSucursalErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, SUCURSAL_ERROR_MESSAGES);
};
