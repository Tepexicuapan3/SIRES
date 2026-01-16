import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";

import { env } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { requestInterceptor } from "./interceptors/request.interceptor";
import {
  responseInterceptor,
  errorInterceptor401,
} from "./interceptors/response.interceptor";
import { errorInterceptor } from "./interceptors/error.interceptor";

/**
 * Cliente Axios configurado para la API de SIRES
 *
 * IMPORTANTE: Usa HttpOnly cookies para autenticación
 * - Los tokens NO se almacenan en localStorage (vulnerabilidad XSS)
 * - Las cookies se envían automáticamente con withCredentials: true
 * - El CSRF token se envía en header X-CSRF-TOKEN
 *
 * Refactorizado: Interceptors separados por responsabilidad
 * - Request: Agrega Request ID y CSRF token
 * - Response: Valida con Zod y maneja 401 con auto-refresh
 * - Error: Transforma AxiosError en ApiError estandarizado
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

// ==========================================
// CONFIGURAR INTERCEPTORS
// ==========================================

/**
 * Interceptor de Request
 * - Agrega Request ID (OBLIGATORIO en sistemas médicos)
 * - Agrega CSRF token a requests que modifican datos
 */
apiClient.interceptors.request.use(requestInterceptor);

/**
 * Interceptor de Response
 * - Valida respuestas con Zod (contract validation)
 * - Maneja 401 con auto-refresh de token
 */
apiClient.interceptors.response.use(responseInterceptor);

/**
 * Interceptor de Error (401 handling)
 * - Maneja refresh de token en errores 401
 * - Excepciones para endpoints sin retry
 */
apiClient.interceptors.response.use(errorInterceptor401);

/**
 * Interceptor de Error (transformación)
 * - Transforma AxiosError en ApiError estandarizado
 * - Loggear en development
 * - Inyecta Request ID y timestamp
 */
apiClient.interceptors.response.use(errorInterceptor);

export default apiClient;
export { apiClient as api };
