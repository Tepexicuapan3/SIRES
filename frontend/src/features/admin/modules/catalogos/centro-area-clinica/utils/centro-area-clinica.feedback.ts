import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const CENTRO_AREA_CLINICA_ERROR_MESSAGES: Record<string, string> = {
  CARE_CENTER_CLINICAL_AREA_NOT_FOUND: "La asignación no existe o fue eliminada.",
  CARE_CENTER_CLINICAL_AREA_EXISTS: "El área clínica ya está asignada a este centro.",
  CARE_CENTER_NOT_FOUND: "El centro de atención no existe.",
  CLINICAL_AREA_NOT_FOUND: "El área clínica no existe.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta acción.",
  SESSION_EXPIRED: "Tu sesión expiró. Inicia sesión nuevamente.",
  NETWORK_ERROR: "No hay conexión con el servidor. Intenta nuevamente.",
};

export const getCentroAreaClinicaErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, CENTRO_AREA_CLINICA_ERROR_MESSAGES);
};
