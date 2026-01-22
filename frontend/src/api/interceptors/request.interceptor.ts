/**
 * Request Interceptor
 *
 * Se ejecuta ANTES de cada request al backend.
 *
 * RESPONSABILIDADES:
 * 1. X-Request-ID: Traceability (obligatorio para el sistema médico)
 * 2. X-CSRF-TOKEN: Protección CSRF en métodos mutantes
 *
 * ¿POR QUÉ X-Request-ID?
 * En sistemas de salud, si algo falla, necesitás poder rastrear
 * el request desde el frontend hasta los logs del backend.
 * Este ID único conecta todo el flujo.
 *
 * ¿POR QUÉ CSRF SOLO EN MUTACIONES?
 * Los ataques CSRF explotan acciones que CAMBIAN datos.
 * Un GET no puede hacer daño porque solo lee.
 * POST/PUT/PATCH/DELETE sí modifican, por eso necesitan protección.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// Métodos HTTP que modifican datos (requieren CSRF)
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Configura el interceptor de request en el cliente Axios
 */
export function setupRequestInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // 1. Request ID para traceability
    config.headers["X-Request-ID"] = crypto.randomUUID();

    // 2. CSRF token para métodos mutantes
    if (
      config.method &&
      MUTATING_METHODS.includes(config.method.toUpperCase())
    ) {
      const csrfToken = Cookies.get("csrf_access_token");
      if (csrfToken) {
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }

    return config;
  });
}
