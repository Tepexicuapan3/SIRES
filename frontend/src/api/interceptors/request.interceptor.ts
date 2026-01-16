/**
 * Request Interceptor
 *
 * Agrega Request ID (OBLIGATORIO en sistemas médicos) y CSRF token a requests.
 * Basado en estándares definidos en: ../standards.md
 */

import type { InternalAxiosRequestConfig } from "axios";
import { Cookie } from "js-cookie";

/**
 * Genera un Request ID único (UUID v4)
 * Importante: En sistemas médicos, TODOS los requests deben tener un Request ID para traceability.
 */
export const generateRequestId = (): string => {
  return crypto.randomUUID();
};

/**
 * Obtener el CSRF token de la cookie
 * Usa js-cookie en vez de implementación manual.
 */
export const getCsrfToken = (): string | undefined => {
  return Cookie.get("csrf_access_token");
};

/**
 * Interceptor de Request
 *
 * Agrega:
 * - Request ID (para traceability en sistemas médicos críticos)
 * - CSRF token (para métodos mutantes: POST, PUT, PATCH, DELETE)
 */
export const requestInterceptor = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  // 1. Agregar Request ID (OBLIGATORIO en sistemas médicos)
  const requestId = generateRequestId();
  config.headers["X-Request-ID"] = requestId;

  // 2. Agregar CSRF token para métodos que lo requieren
  const methodsRequiringCsrf = ["POST", "PUT", "PATCH", "DELETE"];

  if (
    config.method &&
    methodsRequiringCsrf.includes(config.method.toUpperCase())
  ) {
    const csrfToken = getCsrfToken();
    if (csrfToken && config.headers) {
      config.headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }

  // 3. Retornar config modificado
  return config;
};

/**
 * Verifica si el método requiere CSRF token
 */
export const requiresCsrfToken = (method?: string): boolean => {
  if (!method) return false;
  const methodsRequiringCsrf = ["POST", "PUT", "PATCH", "DELETE"];
  return methodsRequiringCsrf.includes(method.toUpperCase());
};
