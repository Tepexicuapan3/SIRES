/**
 * Cliente HTTP — Portal de Citas en Línea
 * ==========================================
 *
 * Por qué axios (y no fetch nativo): el proyecto interno (`frontend/`) ya
 * usa axios y este portal reutiliza esa misma versión fijada en
 * package.json — no hay razón para introducir una segunda forma de hacer
 * requests en el monorepo. Axios además da interceptors declarativos
 * (request/response) sin tener que envolver `fetch` a mano, y transforma
 * automáticamente la respuesta a JSON.
 *
 * DIFERENCIA CLAVE con `frontend/src/infrastructure/api/client.ts`:
 * ese cliente usa `withCredentials: true` (cookies HttpOnly + CSRF,
 * mismo origen). Este portal se autentica con **Bearer token** en el
 * header `Authorization` (ver `apps.portal_citas.authentication.
 * PortalTokenAuthentication` en el backend) y corre en un dominio
 * separado — por eso NO lleva `withCredentials` ni maneja CSRF.
 */

import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";

import { env } from "@/config/env";
import { clearToken, getToken } from "@/api/authStore";

export interface ApiErrorPayload {
  code: string;
  message: string;
  status: number;
  timestamp?: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/** Envuelve el error de dominio del backend (ver `response_service.error_response`). */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.code = payload.code;
    this.status = payload.status;
    this.details = payload.details;
  }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request: adjunta el Bearer token en cada request autenticado. Los 3
// endpoints de login son públicos y no mandan token (no hay uno todavía),
// pero adjuntarlo igual cuando existe no rompe nada del lado del backend.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: normaliza errores al shape `ApiError` y maneja 401 (token
// vencido o inválido) limpiando la sesión y mandando a /login. No hay
// refresh token en este backend (ver authStore.ts), así que un 401 es
// siempre terminal para la sesión actual.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const data = error.response?.data;

    if (error.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    if (data && typeof data === "object" && "code" in data) {
      return Promise.reject(new ApiError(data));
    }

    // DRF genérico (throttling, 404, permisos) no pasa por
    // `response_service.error_response` y responde `{ detail: string }` en
    // su lugar (ej. el 429 de PortalAuthRateThrottle: "Request was
    // throttled. Expected available in N seconds.").
    if (data && typeof data === "object" && "detail" in data) {
      const detail = String((data as { detail: unknown }).detail);
      return Promise.reject(
        new ApiError({
          code: error.response?.status === 429 ? "RATE_LIMITED" : "REQUEST_ERROR",
          message:
            error.response?.status === 429
              ? "Hiciste demasiados intentos. Espera unos minutos e intenta de nuevo."
              : detail,
          status: error.response?.status ?? 0,
        })
      );
    }

    return Promise.reject(
      new ApiError({
        code: "NETWORK_ERROR",
        message: "No se pudo conectar con el servidor. Intenta de nuevo.",
        status: error.response?.status ?? 0,
      })
    );
  }
);

export default apiClient;
