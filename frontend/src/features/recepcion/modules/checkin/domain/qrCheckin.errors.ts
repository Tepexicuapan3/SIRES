import { ApiError } from "@api/utils/errors";

/**
 * Traduce los códigos de dominio que devuelve el backend de check-in por QR
 * (`backend/apps/recepcion/uses_case/qr_checkin_usecase.py`) a mensajes
 * orientados al personal de recepción — sin jerga técnica de códigos.
 *
 * `CITA_ESTADO_NO_VALIDO` y `CHECKIN_YA_REGISTRADO` reusan el mensaje que ya
 * arma el backend (`error.message`) porque incluye datos dinámicos que acá no
 * tenemos (la etiqueta exacta del estatus, la fecha/hora del check-in
 * previo) — reconstruirlos en el frontend duplicaría esa lógica sin ganar
 * nada.
 */
export const resolveQrCheckinErrorMessage = (error: unknown): string => {
  const fallback = "No se pudo procesar el código. Intenta nuevamente.";

  if (!(error instanceof ApiError)) {
    return fallback;
  }

  switch (error.code) {
    case "QR_INVALIDO":
      return "Este código QR no es válido o fue alterado. Pídele al paciente que muestre nuevamente el comprobante o que genere uno nuevo desde el portal.";
    case "CITA_NO_ENCONTRADA":
      return "No se encontró ninguna cita con este código. Verifica que sea el comprobante correcto del paciente.";
    case "ROLE_NOT_ALLOWED":
      return "No tienes permiso para confirmar este check-in. Pide ayuda a un usuario con permisos de recepción.";
    case "VALIDATION_ERROR":
      return "El código leído no tiene un formato válido. Vuelve a escanear el comprobante.";
    case "CITA_ESTADO_NO_VALIDO":
    case "CHECKIN_YA_REGISTRADO":
      return error.message || fallback;
    default:
      return error.message || fallback;
  }
};
