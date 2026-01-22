/**
 * Cliente HTTP - SIRES API
 *
 * Punto de entrada ÚNICO para todas las llamadas al backend.
 *
 * RESPONSABILIDADES:
 * 1. Configuración base de Axios (URL, timeout, credentials)
 * 2. Inyección de headers (CSRF, Request-ID)
 * 3. Manejo de errores (transformar a ApiError, refresh token en 401)
 *
 * SEGURIDAD:
 * - Los JWT viajan en cookies HttpOnly (el JS no puede leerlos)
 * - CSRF token se envía en header X-CSRF-TOKEN para mutaciones
 * - withCredentials: true permite que el browser envíe las cookies
 *
 * @example
 * ```typescript
 * // En resources/auth.api.ts
 * import apiClient from "@api/client";
 *
 * const response = await apiClient.post<LoginResponse>("/auth/login", data);
 * return response.data;
 * ```
 */

import axios from "axios";
import type { AxiosInstance } from "axios";

import { env } from "@/config/env";
import { setupRequestInterceptor } from "@api/interceptors/request.interceptor";
import { setupErrorInterceptor } from "@api/interceptors/error.interceptor";

// ==========================================
// CONFIGURACIÓN BASE
// ==========================================

const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // CRÍTICO: Permite envío/recepción de cookies HttpOnly
  withCredentials: true,
});

// ==========================================
// INTERCEPTORS
// ==========================================

// Request: Agrega X-Request-ID y X-CSRF-TOKEN
setupRequestInterceptor(apiClient);

// Response/Error: Maneja 401 con refresh + transforma errores a ApiError
setupErrorInterceptor(apiClient);

// ==========================================
// EXPORT
// ==========================================

export default apiClient;
