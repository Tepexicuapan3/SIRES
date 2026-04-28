import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ESPECIALIDADES_ERROR_MESSAGES: Record<string, string> = {
  SPECIALTY_NOT_FOUND: "La especialidad ya no existe o fue eliminada.",
  SPECIALTY_EXISTS: "Ya existe una especialidad con ese nombre.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta acción.",
  SESSION_EXPIRED: "Tu sesión expiró. Inicia sesión nuevamente.",
  NETWORK_ERROR: "No hay conexión con el servidor. Intenta nuevamente.",
};

export const getEspecialidadErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  return getCatalogErrorMessage(
    error,
    fallback,
    ESPECIALIDADES_ERROR_MESSAGES,
  );
};
