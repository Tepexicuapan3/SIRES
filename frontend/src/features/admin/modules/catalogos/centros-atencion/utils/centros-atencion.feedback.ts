import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const CENTROS_ERROR_MESSAGES: Record<string, string> = {
  CLINIC_NOT_FOUND: "El centro ya no existe o fue eliminado.",
  CLINIC_EXISTS: "Ya existe un centro con ese nombre.",
  FOLIO_CODE_EXISTS: "El folio ya esta en uso por otro centro.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getCentroAtencionErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  return getCatalogErrorMessage(error, fallback, CENTROS_ERROR_MESSAGES);
};
