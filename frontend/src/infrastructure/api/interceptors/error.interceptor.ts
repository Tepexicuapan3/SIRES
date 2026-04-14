/**
 * Error Interceptor
 *
 * Se ejecuta cuando el backend responde con error (4xx, 5xx) o hay fallo de red.
 *
 * RESPONSABILIDADES:
 * 1. Refresh automático de token en errores 401
 * 2. Transformar errores de Axios a ApiError (formato consistente)
 * 3. Logging en desarrollo (sin datos sensibles)
 *
 * ¿CÓMO FUNCIONA EL REFRESH?
 * 1. Request falla con 401 (token expirado)
 * 2. Intentamos POST /auth/refresh (el refresh_token está en cookie)
 * 3. Si funciona: reintentamos el request original con el nuevo token
 * 4. Si falla: sesión expirada, redirigimos al login
 *
 * ¿POR QUÉ ApiError?
 * Sin normalización, cada componente interpreta errores diferente.
 * Con ApiError, TODOS los errores tienen: code, message, status, requestId.
 */

import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { ApiError, ERROR_CODES, type ApiErrorPayload } from "@api/utils/errors";
import { createRequestId } from "@api/utils/request-id";
import { queryClient } from "@app/config/query-client";
import { clearAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { syncAuthSessionRevision } from "@/domains/auth-access/adapters/auth-session-sync";
import { emitSessionExpired } from "@/domains/auth-access/adapters/session-events";
import { env } from "@app/config/env";

// Endpoints que NO deben intentar refresh (evita loops infinitos)
const NO_REFRESH_ENDPOINTS = [
  "/auth/login",
  "/auth/logout",
  "/auth/refresh",
  "/auth/reset-password",
  "/auth/complete-onboarding",
];

// Flag para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Configura el interceptor de errores en el cliente Axios
 */
export function setupErrorInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    // Success: pasar la respuesta sin modificar
    (response) => {
      syncAuthSessionRevision({
        headers: response.headers,
        requestUrl: response.config?.url,
      });

      return response;
    },

    // Error: manejar 401 y transformar a ApiError
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      syncAuthSessionRevision({
        headers: error.response?.headers,
        requestUrl: originalRequest?.url,
      });

      // ¿Es un 401 que podemos reintentar?
      const shouldAttemptRefresh =
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !NO_REFRESH_ENDPOINTS.some((ep) => originalRequest.url?.includes(ep));

      if (shouldAttemptRefresh) {
        originalRequest._retry = true;

        try {
          // Evitar múltiples refreshes simultáneos
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = attemptTokenRefresh(originalRequest);
          }

          const refreshSucceeded = await refreshPromise;

          if (refreshSucceeded) {
            // Reintentar request original con nuevo token
            return client(originalRequest);
          }
        } catch {
          // Refresh falló, continuar con el error original
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }

      // Transformar a ApiError y rechazar
      throw transformToApiError(error);
    },
  );
}

/**
 * Intenta renovar el token de acceso
 */
async function attemptTokenRefresh(
  originalRequest: InternalAxiosRequestConfig,
): Promise<boolean> {
  const csrfToken = Cookies.get("csrf_token");
  if (!csrfToken) {
    return false;
  }

  try {
    const response = await fetch(`${env.apiUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include", // Envía cookies
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID":
          (originalRequest.headers?.["X-Request-ID"] as string) ||
          createRequestId(),
        "X-CSRF-TOKEN": csrfToken,
      },
    });

    if (response.ok) {
      return true;
    }

    // Refresh falló - sesión expirada
    handleSessionExpired();
    return false;
  } catch {
    // Error de red durante refresh
    handleSessionExpired();
    return false;
  }
}

/**
 * Maneja sesión expirada - notifica al store para redirección
 */
function handleSessionExpired(): void {
  clearAuthSession(queryClient);
  emitSessionExpired();
}

/**
 * Transforma AxiosError en ApiError normalizado
 */
function transformToApiError(error: AxiosError): ApiError {
  const requestId = resolveRequestId(error);

  // Error de red (sin conexión, timeout, etc.)
  if (!error.response) {
    return new ApiError(
      ERROR_CODES.NETWORK_ERROR,
      error.message || "No hay conexión a internet",
      0,
      undefined,
      requestId,
    );
  }

  // Error del backend
  const { status, data } = error.response;
  const errorData = data as Partial<ApiErrorPayload>;

  return new ApiError(
    (errorData?.code as keyof typeof ERROR_CODES) ||
      getDefaultErrorCode(status),
    errorData?.message || getDefaultMessage(status),
    status,
    errorData?.details,
    requestId,
  );
}

function resolveRequestId(error: AxiosError): string | undefined {
  const requestHeaderId = error.config?.headers?.["X-Request-ID"] as
    | string
    | undefined;
  if (requestHeaderId) {
    return requestHeaderId;
  }

  const responseData = error.response?.data as
    | { requestId?: unknown }
    | undefined;
  if (typeof responseData?.requestId === "string" && responseData.requestId) {
    return responseData.requestId;
  }

  const responseHeaders = error.response?.headers as
    | Record<string, unknown>
    | undefined;

  const responseHeaderId =
    responseHeaders?.["x-request-id"] ?? responseHeaders?.["X-Request-ID"];

  return typeof responseHeaderId === "string" && responseHeaderId
    ? responseHeaderId
    : undefined;
}

/**
 * Código de error por defecto según HTTP status
 *
 * IMPORTANTE: El backend siempre debe enviar `errorData.code` específico.
 * Estos defaults son solo fallback cuando el backend no informa código.
 */
function getDefaultErrorCode(status: number): string {
  switch (status) {
    case 400:
      return ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return ERROR_CODES.TOKEN_EXPIRED;
    case 403:
      return ERROR_CODES.PERMISSION_DENIED;
    case 404:
      return ERROR_CODES.NOT_FOUND; // Generic fallback - backend debe especificar USER_NOT_FOUND/ROLE_NOT_FOUND/etc.
    case 409:
      return ERROR_CODES.CONFLICT; // Generic fallback - backend debe especificar USER_EXISTS/ROLE_EXISTS/etc.
    case 423:
      return ERROR_CODES.ACCOUNT_LOCKED;
    case 429:
      return ERROR_CODES.RATE_LIMIT_EXCEEDED;
    case 503:
      return ERROR_CODES.SERVICE_UNAVAILABLE;
    default:
      return ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Mensaje por defecto según HTTP status
 */
function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return "Hay errores en el formulario";
    case 401:
      return "Sesión expirada";
    case 403:
      return "No tienes permiso para esta acción";
    case 404:
      return "Recurso no encontrado";
    case 409:
      return "El recurso ya existe";
    case 429:
      return "Demasiadas solicitudes, intenta en unos minutos";
    case 503:
      return "Servicio temporalmente no disponible";
    case 500:
      return "Error interno del servidor";
    default:
      return "Error desconocido";
  }
}
