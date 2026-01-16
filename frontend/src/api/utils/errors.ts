/**
 * API Error Handling Utils
 *
 * Clase ApiError estandarizada y códigos de error para SIRES.
 * Basado en estándares definidos en: ../standards.md
 */

// ==========================================
// ERROR CODES (Estándarizados)
// ==========================================

export const ERROR_CODES = {
  // ===== AUTH ERRORS (4xx) =====
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // ===== VALIDATION ERRORS (400) =====
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FIELD_REQUIRED: "FIELD_REQUIRED",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_DATE: "INVALID_DATE",

  // ===== BUSINESS LOGIC ERRORS (4xx) =====
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
  PERMISSION_NOT_FOUND: "PERMISSION_NOT_FOUND",
  CLINIC_NOT_FOUND: "CLINIC_NOT_FOUND",
  USER_ALREADY_ACTIVE: "USER_ALREADY_ACTIVE",
  USER_ALREADY_INACTIVE: "USER_ALREADY_INACTIVE",
  CANNOT_DELETE_SYSTEM_ROLE: "CANNOT_DELETE_SYSTEM_ROLE",
  CANNOT_DELETE_ROLE_WITH_USERS: "CANNOT_DELETE_ROLE_WITH_USERS",

  // ===== SYSTEM ERRORS (5xx) =====
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // ===== NETWORK ERRORS =====
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

/**
 * Tipo de código de error
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ==========================================
// API ERROR CLASS
// ==========================================

/**
 * Error estandarizado de API de SIRES
 *
 * El backend DEBE retornar errores con esta estructura.
 * El interceptor de response transormará AxiosError en ApiError.
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public status: number,
    public details?: Record<string, string[]>,
    public requestId?: string,
    public timestamp: Date = new Date(),
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Crear un ApiError desde un AxiosError
   *
   * @example
   * ```typescript
   * try {
   *   await apiClient.get('/endpoint');
   * } catch (error) {
   *   const apiError = error instanceof AxiosError
   *     ? ApiError.fromAxiosError(error)
   *     : error;
   * }
   * ```
   */
  static fromAxiosError(axiosError: unknown): ApiError {
    if (!axiosError.response) {
      // Network error (sin conexión)
      return new ApiError(
        ERROR_CODES.NETWORK_ERROR,
        axiosError.message || "No hay conexión a internet",
        0,
        undefined,
        axiosError.config?.headers?.["X-Request-ID"],
      );
    }

    const response = axiosError.response;
    const data = response.data;

    return new ApiError(
      data?.code || getErrorCodeFromStatus(response.status),
      data?.message || getDefaultMessage(response.status),
      response.status,
      data?.details,
      axiosError.config?.headers?.["X-Request-ID"],
    );
  }

  /**
   * Obtener código de error por HTTP status
   */
  static getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ERROR_CODES.VALIDATION_ERROR;
      case 401:
        return ERROR_CODES.TOKEN_EXPIRED;
      case 403:
        return ERROR_CODES.PERMISSION_DENIED;
      case 404:
        return ERROR_CODES.USER_NOT_FOUND;
      case 409:
        return ERROR_CODES.USER_EXISTS;
      case 500:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
      default:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Obtener mensaje por defecto por HTTP status
   */
  static getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return "Error de validación";
      case 401:
        return "No estás autenticado";
      case 403:
        return "No tienes permiso para realizar esta acción";
      case 404:
        return "Recurso no encontrado";
      case 409:
        return "El recurso ya existe";
      case 500:
        return "Error interno del servidor";
      default:
        return "Error desconocido";
    }
  }
}

/**
 * Helper function para obtener código de error por status
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  return ApiError.getErrorCodeFromStatus(status);
}

/**
 * Helper function para obtener mensaje por defecto por status
 */
function getDefaultMessage(status: number): string {
  return ApiError.getDefaultMessage(status);
}

// ==========================================
// ERROR MESSAGES (User-friendly)
// ==========================================

export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: "Usuario o contraseña incorrectos",
  [ERROR_CODES.TOKEN_EXPIRED]:
    "Tu sesión ha expirado, inicia sesión nuevamente",
  [ERROR_CODES.TOKEN_INVALID]: "Token inválido, inicia sesión nuevamente",
  [ERROR_CODES.SESSION_EXPIRED]: "Tu sesión ha expirado",
  [ERROR_CODES.PERMISSION_DENIED]:
    "No tienes permiso para realizar esta acción",
  [ERROR_CODES.VALIDATION_ERROR]: "Hay errores en el formulario",
  [ERROR_CODES.FIELD_REQUIRED]: "Este campo es requerido",
  [ERROR_CODES.INVALID_FORMAT]: "El formato no es válido",
  [ERROR_CODES.INVALID_EMAIL]: "El correo electrónico no es válido",
  [ERROR_CODES.INVALID_PASSWORD]:
    "La contraseña debe tener al menos 8 caracteres",
  [ERROR_CODES.INVALID_PHONE]: "El teléfono no es válido",
  [ERROR_CODES.INVALID_DATE]: "La fecha no es válida",
  [ERROR_CODES.USER_EXISTS]:
    "Ya existe un usuario con este correo o expediente",
  [ERROR_CODES.USER_NOT_FOUND]: "El usuario no existe",
  [ERROR_CODES.ROLE_NOT_FOUND]: "El rol no existe",
  [ERROR_CODES.PERMISSION_NOT_FOUND]: "El permiso no existe",
  [ERROR_CODES.CLINIC_NOT_FOUND]: "La clínica no existe",
  [ERROR_CODES.USER_ALREADY_ACTIVE]: "El usuario ya está activo",
  [ERROR_CODES.USER_ALREADY_INACTIVE]: "El usuario ya está inactivo",
  [ERROR_CODES.CANNOT_DELETE_SYSTEM_ROLE]:
    "No se puede eliminar roles de sistema",
  [ERROR_CODES.CANNOT_DELETE_ROLE_WITH_USERS]:
    "El rol tiene usuarios asignados, no se puede eliminar",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]:
    "Ocurrió un error inesperado, intenta nuevamente",
  [ERROR_CODES.DATABASE_ERROR]:
    "Error al acceder a la base de datos, intenta nuevamente",
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]:
    "Error al conectar con servicio externo",
  [ERROR_CODES.NETWORK_ERROR]: "No hay conexión a internet",
  [ERROR_CODES.TIMEOUT_ERROR]:
    "La petición tardó demasiado tiempo, intenta nuevamente",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    "Has excedido el límite de peticiones, espera unos minutos",
} as const;

/**
 * Obtener mensaje user-friendly por código de error
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || "Error desconocido";
}
