import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const CENTROS_ERROR_MESSAGES: Record<string, string> = {
  CARE_CENTER_NOT_FOUND: "El centro ya no existe o fue eliminado.",
  CARE_CENTER_EXISTS: "Ya existe un centro con ese nombre o CLUES.",
  CARE_CENTER_SCHEDULE_NOT_FOUND: "El horario ya no existe o fue eliminado.",
  CARE_CENTER_SCHEDULE_EXISTS: "Ya existe un horario para ese centro, turno y dia.",
  CARE_CENTER_EXCEPTION_NOT_FOUND: "La excepción ya no existe o fue eliminada.",
  CARE_CENTER_EXCEPTION_EXISTS: "Ya existe una excepción para ese centro en esa fecha.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getCentroAtencionErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  return getCatalogErrorMessage(error, fallback, CENTROS_ERROR_MESSAGES);
};
