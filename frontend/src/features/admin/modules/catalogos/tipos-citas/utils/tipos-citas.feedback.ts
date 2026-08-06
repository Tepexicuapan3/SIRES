import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const TIPOS_CITAS_ERROR_MESSAGES: Record<string, string> = {
  APPOINTMENT_TYPE_NOT_FOUND: "El tipo de cita ya no existe o fue eliminado.",
  APPOINTMENT_TYPE_EXISTS: "Ya existe un tipo de cita con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getTipoCitaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, TIPOS_CITAS_ERROR_MESSAGES);
};
