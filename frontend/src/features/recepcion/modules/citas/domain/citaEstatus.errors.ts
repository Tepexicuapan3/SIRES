/**
 * Mensajes user-friendly para los errores de dominio que puede devolver
 * `PATCH /citas/{id}/estatus` (ver `CitaEstatusView.patch` en
 * `backend/apps/recepcion/views/citas_views.py` y la máquina de estados en
 * `backend/apps/recepcion/uses_case/cita_state_machine_usecase.py`).
 */
export const CITA_ESTATUS_DOMAIN_ERROR_MESSAGE: Record<
  | "CITA_MOTIVO_REQUERIDO"
  | "CITA_STATE_INVALID"
  | "CITA_NOT_FOUND"
  | "ROLE_NOT_ALLOWED"
  | "PERMISSION_DENIED"
  | "VALIDATION_ERROR",
  string
> = {
  CITA_MOTIVO_REQUERIDO:
    "Se requiere un motivo para cancelar la cita.",
  CITA_STATE_INVALID:
    "La cita ya no esta en un estado valido para cancelarse. Actualiza la agenda.",
  CITA_NOT_FOUND: "La cita ya no existe o fue modificada por otro usuario.",
  ROLE_NOT_ALLOWED: "No tenes permiso para cancelar citas.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
  VALIDATION_ERROR: "No se pudo procesar la cancelacion. Revisa el motivo ingresado.",
};

export const FALLBACK_CITA_ESTATUS_ERROR_MESSAGE =
  "No se pudo cancelar la cita. Intenta nuevamente.";

/** Estados de una CitaMedica desde los cuales se permite cancelar (coincide con
 * los estados de origen soportados por `TRANSITION_RULES` para "cancelada"). */
export const CITA_ESTATUS_CANCELABLE = new Set(["agendada", "confirmada"]);
