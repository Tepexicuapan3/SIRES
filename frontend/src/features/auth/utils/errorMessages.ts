/**
 * Error Messages - Centralización de Mapeo de Códigos de Error
 *
 * PROPÓSITO:
 * Single source of truth para mensajes de error del backend.
 * Evita duplicación entre OnboardingPage, LoginPage, Recovery flows.
 *
 * USO:
 * ```tsx
 * import { onboardingErrorMessages, loginErrorMessages } from "@/features/auth/utils/errorMessages";
 *
 * const displayMessage = onboardingErrorMessages[errorCode] || "Error inesperado";
 * ```
 *
 * CONVENCIÓN:
 * - Error codes en UPPER_SNAKE_CASE (del backend)
 * - Mensajes en español, tono directo y amigable
 * - NO usar puntos finales (consistencia con toast UI)
 */

/**
 * Errores de Validación de Contraseña
 * (compartidos entre onboarding y recovery)
 */
export const passwordErrorMessages: Record<string, string> = {
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres",
  PASSWORD_NO_UPPERCASE: "La contraseña debe incluir al menos una mayúscula",
  PASSWORD_NO_NUMBER: "La contraseña debe incluir al menos un número",
  PASSWORD_NO_SPECIAL:
    "La contraseña debe incluir al menos un carácter especial",
  PASSWORD_REQUIRED: "La contraseña es requerida",
  PASSWORD_UPDATE_FAILED: "Error al actualizar la contraseña. Intenta de nuevo",
};

/**
 * Errores de Autenticación (Login)
 */
export const loginErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "Usuario o contraseña incorrectos",
  USER_LOCKED: "Cuenta bloqueada temporalmente por seguridad",
  USER_INACTIVE: "Tu usuario está inactivo. Contacta al administrador",
  USER_NOT_FOUND: "El usuario no existe",
  TOO_MANY_REQUESTS: "Demasiados intentos. Espera unos minutos",
  IP_BLOCKED: "Tu IP ha sido bloqueada temporalmente",
  SERVER_ERROR: "Error del servidor. Intenta más tarde",
};

/**
 * Errores de Onboarding
 * (incluye errores de contraseña + específicos de onboarding)
 */
export const onboardingErrorMessages: Record<string, string> = {
  ...passwordErrorMessages,
  ONBOARDING_NOT_REQUIRED: "Tu cuenta ya está activada. Redirigiendo...",
  TERMS_NOT_ACCEPTED: "Debes aceptar los términos y condiciones",
  INVALID_SCOPE: "Tu sesión expiró. Por favor inicia sesión nuevamente",
  INVALID_TOKEN: "Sesión inválida. Por favor inicia sesión nuevamente",
  USER_NOT_FOUND: "Usuario no encontrado",
  ONBOARDING_UPDATE_FAILED:
    "Error al completar la activación. Intenta de nuevo",
  SERVER_ERROR: "Error del servidor. Intenta más tarde",
};

/**
 * Errores de Recuperación de Contraseña
 */
export const recoveryErrorMessages: Record<string, string> = {
  ...passwordErrorMessages,
  INVALID_SCOPE: "El enlace ha expirado. Solicita uno nuevo",
  INVALID_CODE: "Código de verificación inválido o expirado",
  CODE_EXPIRED: "El código ha expirado. Solicita uno nuevo",
  USER_NOT_FOUND: "Usuario no encontrado",
  EMAIL_SEND_FAILED: "Error al enviar el correo. Intenta de nuevo",
  SERVER_ERROR: "Error del servidor. Intenta más tarde",
};
