/**
 * Response Interceptor
 *
 * Valida respuestas del backend con Zod (contract validation).
 * Maneja errores 401 con auto-refresh de token.
 * Basado en estándares definidos en: ../standards.md
 */

import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/authStore";
import * as Cookies from "js-cookie";

// ==========================================
// SCHEMA MATCHER (Endpoint → Zod Schema)
// ==========================================

/**
 * Mapa de endpoint a schema de Zod para validación
 *
 * Este mapa define los CONTRATOS que el frontend espera del backend.
 * Si el backend no cumple el contrato, se lanza un error CONTRACT_VIOLATION.
 */
const schemaMap = new Map<string, any>([
  // ===== AUTH =====
  ["GET /auth/me", null], // TODO: Importar AuthUserSchema
  ["POST /auth/login", null], // TODO: Importar LoginResponseSchema
  ["POST /auth/refresh", null], // TODO: Importar RefreshTokenResponseSchema
  ["GET /auth/verify", null], // TODO: Importar VerifyTokenResponseSchema
  ["POST /auth/request-reset-code", null], // Void
  ["POST /auth/verify-reset-code", null], // TODO: Importar VerifyResetCodeResponseSchema
  ["POST /auth/reset-password", null], // TODO: Importar LoginResponseSchema (auto-login)
  ["POST /auth/complete-onboarding", null], // TODO: Importar LoginResponseSchema (auto-login)

  // ===== USERS =====
  ["GET /users", null], // TODO: Importar UsersListResponseSchema
  ["GET /users/:id", null], // TODO: Importar UserDetailResponseSchema
  ["POST /users", null], // TODO: Importar CreateUserResponseSchema
  ["PATCH /users/:id", null], // TODO: Importar UpdateUserResponseSchema
  ["PATCH /users/:id/activate", null], // TODO: Importar UserStatusResponseSchema
  ["PATCH /users/:id/deactivate", null], // TODO: Importar UserStatusResponseSchema
  ["GET /users/:id/roles", null], // TODO: Importar UserRolesListResponseSchema
  ["POST /users/:id/roles", null], // TODO: Importar AssignRolesResponseSchema
  ["PUT /users/:id/roles/primary", null], // TODO: Importar SetPrimaryRoleResponseSchema
  ["DELETE /users/:id/roles/:roleId", null], // TODO: Importar RevokeRoleResponseSchema
  ["GET /users/:id/overrides", null], // TODO: Importar UserOverridesResponseSchema
  ["POST /users/:id/overrides", null], // TODO: Importar AddUserOverrideResponseSchema
  ["DELETE /users/:id/overrides/:code", null], // Void

  // ===== ROLES =====
  ["GET /roles", null], // TODO: Importar RolesListResponseSchema
  ["GET /roles/:id", null], // TODO: Importar RoleDetailResponseSchema
  ["POST /roles", null], // TODO: Importar CreateRoleResponseSchema
  ["PUT /roles/:id", null], // TODO: Importar UpdateRoleResponseSchema
  ["DELETE /roles/:id", null], // TODO: Importar DeleteRoleResponseSchema
  ["POST /permissions/assign", null], // TODO: Importar AssignPermissionsResponseSchema
  ["DELETE /permissions/roles/:roleId/permissions/:permissionId", null], // TODO: Importar RevokePermissionResponseSchema

  // ===== PERMISSIONS =====
  ["GET /permissions", null], // TODO: Importar PermissionCatalogResponseSchema

  // ===== CLINICAS =====
  ["GET /clinicas", null], // TODO: Importar ClinicasListResponseSchema
]);

/**
 * Obtener el schema de Zod para el endpoint
 *
 * @param url - URL del endpoint (ej: '/users' o '/users/123')
 * @param method - Método HTTP (GET, POST, etc.)
 * @returns Schema de Zod o null si no hay validación
 */
export function getSchemaForEndpoint(url: string, method: string): any | null {
  // Normalizar URL (remover parámetros dinámicos como IDs)
  const normalized = url.replace(/\/\d+/g, "/:id");
  const key = `${method.toUpperCase()} ${normalized}`;

  return schemaMap.get(key) || null;
}

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

/**
 * Interceptor de response principal
 *
 * Responsabilidades:
 * 1. Validar respuestas con Zod (Contract validation)
 * 2. Manejar 401 con auto-refresh de token
 * 3. Preservar error original para TanStack Query
 */
export const responseInterceptor = (response: AxiosResponse): AxiosResponse => {
  // 1. Obtener schema para este endpoint (si existe)
  const schema = getSchemaForEndpoint(
    response.config.url!,
    response.config.method!,
  );

  if (schema) {
    // 2. Validar respuesta con Zod
    const result = schema.safeParse(response.data);

    if (!result.success) {
      // CONTRATO VIOLADO - El backend no cumple lo que el frontend espera
      if (import.meta.env.DEV) {
        console.error("[CONTRACT VIOLATION]", {
          endpoint: `${response.config.method} ${response.config.url}`,
          expected: schema,
          received: response.data,
          errors: result.error.issues,
          requestId: response.config.headers?.["X-Request-ID"],
        });
      }

      // Lanzar error que será capturado por el interceptor de error
      throw new Error("CONTRACT_VIOLATION: Response does not match schema");
    }
  }

  // 3. Retornar respuesta sin modificar (si la validación pasó o no hay schema)
  return response;
};

/**
 * Interceptor de error para manejo de 401 y refresh de token
 *
 * Este interceptor maneja el caso especial de error 401 (token expirado),
 * intentando renovar el token automáticamente antes de rechazar el error.
 *
 * Importante: Este interceptor PRESERVA el error original para que
 * TanStack Query pueda acceder a error.response.data.code.
 */
export const errorInterceptor401 = async (
  error: AxiosError,
): Promise<never> => {
  const originalRequest = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  // 1. Endpoints que NO deben reintentar en 401
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
    // Retornar error original sin intentar refresh
    return Promise.reject(error);
  }

  // 2. Si es error 401 (token expirado) y no estamos reintentando ya
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      // 3. Intentar renovar el token usando la cookie de refresh
      // El backend lee el refresh_token de la cookie automáticamente
      const { env } = await import("@/config/env");
      await fetch(`${env.apiUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": originalRequest.headers?.["X-Request-ID"] as string,
        },
      });

      // 4. Si el refresh fue exitoso, reintentar la petición original
      // Las nuevas cookies ya están seteadas por el backend
      // NOTA: No podemos reintentar directamente con el apiClient porque
      // necesitamos recrear el request original
      return Promise.reject(error); // Dejar que el interceptor principal reintente
    } catch {
      // 5. Refresh falló - sesión expirada
      // Notificar al store para que la UI maneje la redirección suave
      useAuthStore.getState().setSessionExpired(true);
      useAuthStore.getState().logout();

      // Retornar error original para mantener consistencia
      return Promise.reject(error);
    }
  }

  // 6. Para todos los demás errores, rechazar con el error original
  return Promise.reject(error);
};
