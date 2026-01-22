/**
 * Error Messages - Centralización de Mapeo de Códigos de Error
 *
 * PROPÓSITO:
 * Mapeos especificos para Auth basados en errores globales.
 * Evita duplicacion y mantiene mensajes consistentes en toda la app.
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

import { ERROR_CODES, ERROR_MESSAGES, type ErrorCode } from "@/api/utils/errors";

const pickMessages = (codes: ErrorCode[]) =>
  Object.fromEntries(codes.map((code) => [code, ERROR_MESSAGES[code]])) as Record<
    ErrorCode,
    string
  >;

/**
 * Errores de Autenticación (Login)
 */
export const loginErrorMessages: Record<ErrorCode, string> = {
  ...pickMessages([
    ERROR_CODES.INVALID_CREDENTIALS,
    ERROR_CODES.USER_NOT_FOUND,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ERROR_CODES.ACCOUNT_LOCKED,
    ERROR_CODES.SESSION_EXPIRED,
    ERROR_CODES.TOKEN_EXPIRED,
    ERROR_CODES.TOKEN_INVALID,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ]),
};

/**
 * Errores de Onboarding
 * (incluye errores de contraseña + específicos de onboarding)
 */
export const onboardingErrorMessages: Record<ErrorCode, string> = {
  ...pickMessages([
    ERROR_CODES.PASSWORD_TOO_WEAK,
    ERROR_CODES.SESSION_EXPIRED,
    ERROR_CODES.TOKEN_EXPIRED,
    ERROR_CODES.TOKEN_INVALID,
    ERROR_CODES.USER_NOT_FOUND,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ]),
};

/**
 * Errores de Recuperación de Contraseña
 */
export const recoveryErrorMessages: Record<ErrorCode, string> = {
  ...pickMessages([
    ERROR_CODES.PASSWORD_TOO_WEAK,
    ERROR_CODES.USER_NOT_FOUND,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ]),
};
