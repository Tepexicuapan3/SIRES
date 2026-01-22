/**
 * API Error Utilities
 *
 * Clase ApiError y códigos de error estandarizados para SIRES.
 *
 * ¿POR QUÉ UNA CLASE CUSTOM?
 * Sin ApiError, cada componente interpreta errores diferente:
 *   - Uno chequea error.response?.status
 *   - Otro busca error.response?.data?.code
 *   - Otro asume que error.message existe
 *
 * Con ApiError, TODOS los errores tienen la misma forma:
 *   - error.code     → "TOKEN_EXPIRED"
 *   - error.message  → "Tu sesión expiró"
 *   - error.status   → 401
 *   - error.requestId → "abc-123" (para debugging)
 */

// ==========================================
// CÓDIGOS DE ERROR
// ==========================================

export const ERROR_CODES = {
  // Auth (4xx)
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",

  // Validación (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FIELD_REQUIRED: "FIELD_REQUIRED",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_EMAIL: "INVALID_EMAIL",
  PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",

  // Lógica de negocio (4xx)
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
  PERMISSION_NOT_FOUND: "PERMISSION_NOT_FOUND",
  CLINIC_NOT_FOUND: "CLINIC_NOT_FOUND",
  CANNOT_DELETE_SYSTEM_ROLE: "CANNOT_DELETE_SYSTEM_ROLE",
  CANNOT_REMOVE_LAST_ROLE: "CANNOT_REMOVE_LAST_ROLE",

  // Sistema (5xx)
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Red (0)
  NETWORK_ERROR: "NETWORK_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ==========================================
// MENSAJES USER-FRIENDLY
// ==========================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_CREDENTIALS]: "Usuario o contraseña incorrectos",
  [ERROR_CODES.TOKEN_EXPIRED]: "Tu sesión ha expirado",
  [ERROR_CODES.TOKEN_INVALID]: "Token inválido",
  [ERROR_CODES.REFRESH_TOKEN_EXPIRED]: "Tu sesión ha expirado",
  [ERROR_CODES.SESSION_EXPIRED]: "Tu sesión ha expirado",
  [ERROR_CODES.PERMISSION_DENIED]: "No tienes permiso para esta acción",
  [ERROR_CODES.ACCOUNT_LOCKED]: "Cuenta bloqueada por intentos fallidos",
  [ERROR_CODES.VALIDATION_ERROR]: "Hay errores en el formulario",
  [ERROR_CODES.FIELD_REQUIRED]: "Faltan campos requeridos",
  [ERROR_CODES.INVALID_FORMAT]: "Formato inválido",
  [ERROR_CODES.INVALID_EMAIL]: "Email inválido",
  [ERROR_CODES.PASSWORD_TOO_WEAK]: "La contraseña es demasiado débil",
  [ERROR_CODES.USER_EXISTS]: "Ya existe un usuario con estos datos",
  [ERROR_CODES.USER_NOT_FOUND]: "Usuario no encontrado",
  [ERROR_CODES.ROLE_NOT_FOUND]: "Rol no encontrado",
  [ERROR_CODES.PERMISSION_NOT_FOUND]: "Permiso no encontrado",
  [ERROR_CODES.CLINIC_NOT_FOUND]: "Clinica no encontrada",
  [ERROR_CODES.CANNOT_DELETE_SYSTEM_ROLE]:
    "No se puede eliminar un rol de sistema",
  [ERROR_CODES.CANNOT_REMOVE_LAST_ROLE]:
    "El usuario debe conservar al menos un rol",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "Error del servidor, intenta nuevamente",
  [ERROR_CODES.DATABASE_ERROR]: "Error de base de datos",
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: "Error en servicio externo",
  [ERROR_CODES.NETWORK_ERROR]: "No hay conexión a internet",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "Demasiadas solicitudes, espera un momento",
  [ERROR_CODES.TIMEOUT_ERROR]: "La solicitud excedió el tiempo de espera",
};

// ==========================================
// CLASE ApiError
// ==========================================

/**
 * Error normalizado de la API de SIRES
 *
 * @example
 * ```typescript
 * try {
 *   await apiClient.post("/users", data);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.log(error.code);      // "USER_EXISTS"
 *     console.log(error.message);   // "Ya existe un usuario..."
 *     console.log(error.requestId); // Para soporte técnico
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>,
    public readonly requestId?: string,
    public readonly timestamp: Date = new Date(),
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Obtiene mensaje user-friendly por código
   */
  static getMessage(code: ErrorCode): string {
    return ERROR_MESSAGES[code] || "Error desconocido";
  }
}
