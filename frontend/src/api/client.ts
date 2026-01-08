import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import { getCookie } from "@/lib/utils";

/**
 * Cliente Axios configurado para la API de SIRES
 *
 * IMPORTANTE: Usa HttpOnly cookies para autenticación
 * - Los tokens NO se almacenan en localStorage (vulnerabilidad XSS)
 * - Las cookies se envían automáticamente con withCredentials: true
 * - El CSRF token se envía en header X-CSRF-TOKEN
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // CRÍTICO: Permite envío de cookies en requests cross-origin
  withCredentials: true,
});

/**
 * Interceptor de Request
 * - Agrega CSRF token a requests que modifican datos
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Agregar CSRF token para métodos que lo requieren
    const methodsRequiringCsrf = ["POST", "PUT", "PATCH", "DELETE"];

    if (
      config.method &&
      methodsRequiringCsrf.includes(config.method.toUpperCase())
    ) {
      const csrfToken = getCookie("csrf_access_token");
      if (csrfToken && config.headers) {
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Interceptor de Response
 * - Maneja errores globalmente
 * - Intenta refresh automático en 401
 * - Redirige a login si la sesión expiró
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const apiError = {
      code:
        ((error.response?.data as Record<string, unknown>)?.code as string) ||
        "UNKNOWN_ERROR",
      message:
        ((error.response?.data as Record<string, unknown>)
          ?.message as string) || "Ocurrió un error inesperado",
      status: error.response?.status || 500,
    };

    // Si el error 401 viene de login, logout o refresh, NO reintentar
    const noRetryEndpoints = ["/auth/login", "/auth/logout", "/auth/refresh"];
    const shouldNotRetry = noRetryEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint),
    );

    if (shouldNotRetry) {
      return Promise.reject(apiError);
    }

    // Si es error 401 (token vencido) y no estamos reintentando ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token usando la cookie de refresh
        // El backend lee el refresh_token de la cookie automáticamente
        await axios.post(
          `${env.apiUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // Si el refresh fue exitoso, reintentar la petición original
        // Las nuevas cookies ya están seteadas por el backend
        return apiClient(originalRequest);
      } catch {
        // Refresh falló - sesión expirada
        // Limpiar estado local y redirigir a login
        window.location.href = "/login?expired=true";
        return Promise.reject({ ...apiError, code: "SESSION_EXPIRED" });
      }
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
export { apiClient as api };
