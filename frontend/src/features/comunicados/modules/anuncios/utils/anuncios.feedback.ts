import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

const ANUNCIOS_ERROR_MESSAGES: Record<string, string> = {
  ANUNCIO_NOT_FOUND: "El anuncio ya no existe o fue eliminado.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  INVALID_IMAGE_FORMAT: "La imagen debe ser JPG, PNG o WEBP.",
  IMAGE_TOO_LARGE: "La imagen no puede superar 1 MB.",
  INVALID_ATTACHMENT: "El adjunto debe ser un PDF de máximo 5 MB.",
  INVALID_DATE_RANGE:
    "La vigencia hasta no puede ser anterior a la vigencia desde.",
  INSUFFICIENT_PERMISSIONS: "No tienes permiso para realizar esta acción.",
  PERMISSION_DENIED: "No tienes permiso para realizar esta acción.",
  CSRF_INVALID: "Tu sesión expiró. Inicia sesión nuevamente.",
  SESSION_EXPIRED: "Tu sesión expiró. Inicia sesión nuevamente.",
  NETWORK_ERROR: "No hay conexión con el servidor. Intenta nuevamente.",
};

export const getAnuncioErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, ANUNCIOS_ERROR_MESSAGES);
};
