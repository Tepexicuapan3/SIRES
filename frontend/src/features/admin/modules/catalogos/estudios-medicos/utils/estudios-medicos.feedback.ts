import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ESTUDIOS_MEDICOS_ERROR_MESSAGES: Record<string, string> = {
  MEDICAL_STUDIES_NOT_FOUND: "El estudio medico ya no existe o fue eliminado.",
  MEDICAL_STUDIES_EXISTS: "Ya existe un estudio medico con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta accion.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

export const getEstudioMedicoErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  return getCatalogErrorMessage(
    error,
    fallback,
    ESTUDIOS_MEDICOS_ERROR_MESSAGES,
  );
};
