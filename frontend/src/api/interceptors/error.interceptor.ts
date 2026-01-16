/**
 * Error Interceptor
 *
 * Transforma AxiosError en ApiError estandarizado.
 * Basado en estándares definidos en: ../standards.md
 */

import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError, ERROR_CODES, getErrorMessage } from "../utils/errors";

// ==========================================
// ERROR INTERCEPTOR
// ==========================================

/**
 * Interceptor de error principal
 *
 * Responsabilidades:
 * 1. Transformar AxiosError en ApiError estandarizado
 * 2. Agregar Request ID y timestamp
 * 3. Loggear en development (sin datos sensibles)
 */
export const errorInterceptor = (error: AxiosError): never => {
  const originalRequest = error.config as InternalAxiosRequestConfig;

  // 1. Crear ApiError estandarizado
  let apiError: ApiError;

  if (!error.response) {
    // Network error (sin conexión, timeout, etc.)
    apiError = new ApiError(
      ERROR_CODES.NETWORK_ERROR,
      error.message || "No hay conexión a internet",
      0,
      undefined,
      originalRequest.headers?.["X-Request-ID"] as string,
      new Date(),
    );
  } else {
    // Backend error
    const response = error.response;
    const data = response.data as any;
    const status = response.status;

    // 2. Determinar código de error (usar código del backend si existe)
    const code = data?.code || getErrorCodeFromStatus(status);

    // 3. Determinar mensaje (usar mensaje del backend o default)
    const message = data?.message || getErrorMessage(code);

    // 4. Crear ApiError
    apiError = new ApiError(
      code,
      message,
      status,
      data?.details,
      originalRequest.headers?.["X-Request-ID"] as string,
      new Date(),
    );
  }

  // 5. Loggear en development (sin datos sensibles)
  if (import.meta.env.DEV) {
    console.error("[API ERROR]", {
      endpoint: `${originalRequest.method} ${originalRequest.url}`,
      code: apiError.code,
      message: apiError.message,
      status: apiError.status,
      requestId: apiError.requestId,
      timestamp: apiError.timestamp.toISOString(),
    });
  }

  // 6. Lanzar el ApiError (será capturado por TanStack Query)
  throw apiError;
};

/**
 * Obtener código de error por HTTP status
 *
 * Fallback para cuando el backend no envía código custom.
 */
function getErrorCodeFromStatus(
  status: number,
): (typeof ERROR_CODES)[keyof typeof ERROR_CODES] {
  switch (status) {
    case 400:
      return ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return ERROR_CODES.TOKEN_EXPIRED;
    case 403:
      return ERROR_CODES.PERMISSION_DENIED;
    case 404:
      return ERROR_CODES.USER_NOT_FOUND; // Fallback genérico
    case 409:
      return ERROR_CODES.USER_EXISTS; // Fallback genérico
    case 500:
      return ERROR_CODES.INTERNAL_SERVER_ERROR;
    case 502:
      return ERROR_CODES.EXTERNAL_SERVICE_ERROR;
    default:
      return ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}
