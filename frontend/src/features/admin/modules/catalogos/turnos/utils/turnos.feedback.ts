import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const TURNOS_ERROR_MESSAGES: Record<string, string> = {
  SHIFT_NOT_FOUND: "El turno ya no existe o fue eliminado.",
  SHIFT_EXISTS: "Ya existe un turno con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getTurnoErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, TURNOS_ERROR_MESSAGES);
};
