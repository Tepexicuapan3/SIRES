import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import { getCookie } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

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
 *
 * IMPORTANTE: Este interceptor PRESERVA la estructura AxiosError original
 * para que TanStack Query y los hooks puedan acceder a error.response.data.code
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si el error 401 viene de login, logout, refresh o reset-password, NO reintentar
    // Razón: reset-password usa un token temporal sin refresh token asociado
    const noRetryEndpoints = [
      "/auth/login",
      "/auth/logout",
      "/auth/refresh",
      "/auth/reset-password",
      "/auth/complete-onboarding",
    ];
    const shouldNotRetry = noRetryEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint),
    );

    if (shouldNotRetry) {
      // CRÍTICO: Rechazar con el error original de Axios para preservar error.response.data
      return Promise.reject(error);
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
        // Notificar al store para que la UI maneje la redirección suave
        useAuthStore.getState().setSessionExpired(true);
        useAuthStore.getState().logout();
        
        // Rechazar con el error original para mantener consistencia
        return Promise.reject(error);
      }
    }

    // Para todos los demás errores, rechazar con el error original de Axios
    return Promise.reject(error);
  },
);

export default apiClient;
export { apiClient as api };
