import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";

/**
 * Mapeo de los codigos de `NavigationModuleError` (backend,
 * `use_cases/navigation/exceptions.py`) a mensajes user-friendly.
 */
const MODULE_ERROR_MESSAGES: Record<string, string> = {
  MODULE_NOT_FOUND: "El módulo ya no existe o fue movido.",
  MODULE_SYSTEM_PROTECTED:
    "Este módulo es de sistema y no puede ocultarse ni moverse.",
  PERMISSION_NOT_FOUND:
    "Uno o más permisos del destino ya no existen o están inactivos.",
  PERMISSION_GRANT_NOT_ALLOWED: "No puedes asignar permisos que no tienes.",
  MODULE_MOVE_INVALID:
    "No se puede mover el módulo a esa posición (crearía un ciclo o excede la profundidad máxima).",
  PERMISSION_DENIED: "No tienes permiso para realizar esta acción.",
  SESSION_EXPIRED: "Tu sesión expiró. Inicia sesión nuevamente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de guardar.",
  NETWORK_ERROR: "No hay conexión con el servidor. Intenta nuevamente.",
};

export const getModuleErrorMessage = (error: unknown, fallback: string) => {
  return getCatalogErrorMessage(error, fallback, MODULE_ERROR_MESSAGES);
};
