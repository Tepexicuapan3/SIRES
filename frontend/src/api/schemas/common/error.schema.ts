/**
 * Error Schemas (Common)
 *
 * Schemas comunes para manejo de errores de API.
 * Basado en estándares definidos en: ../standards.md
 */

import { z } from "zod";

/**
 * Códigos de error estándarizados
 *
 * Basado en: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * + Códigos custom para lógica de negocio específica de SIRES
 */
export const ErrorCodeSchema = z.enum([
  // ===== AUTH ERRORS (4xx) =====
  "INVALID_CREDENTIALS", // 400 - Credenciales inválidas
  "TOKEN_EXPIRED", // 401 - Token de acceso expiró
  "TOKEN_INVALID", // 401 - Token inválido o malformado
  "SESSION_EXPIRED", // 401 - Sesión del usuario expiró
  "PERMISSION_DENIED", // 403 - No tiene permiso para realizar esta acción

  // ===== VALIDATION ERRORS (400) =====
  "VALIDATION_ERROR", // 400 - Error genérico de validación
  "FIELD_REQUIRED", // 400 - Campo requerido faltante
  "INVALID_FORMAT", // 400 - Formato de campo inválido
  "INVALID_EMAIL", // 400 - Email inválido
  "INVALID_PASSWORD", // 400 - Password no cumple requisitos
  "INVALID_PHONE", // 400 - Teléfono inválido
  "INVALID_DATE", // 400 - Fecha inválida

  // ===== BUSINESS LOGIC ERRORS (4xx) =====
  "USER_EXISTS", // 409 - El usuario ya existe
  "USER_NOT_FOUND", // 404 - Usuario no encontrado
  "ROLE_NOT_FOUND", // 404 - Rol no encontrado
  "PERMISSION_NOT_FOUND", // 404 - Permiso no encontrado
  "CLINIC_NOT_FOUND", // 404 - Clínica no encontrada
  "USER_ALREADY_ACTIVE", // 409 - Usuario ya está activo
  "USER_ALREADY_INACTIVE", // 409 - Usuario ya está inactivo
  "CANNOT_DELETE_SYSTEM_ROLE", // 403 - No se puede eliminar rol de sistema
  "CANNOT_DELETE_ROLE_WITH_USERS", // 409 - No se puede eliminar rol con usuarios

  // ===== SYSTEM ERRORS (5xx) =====
  "INTERNAL_SERVER_ERROR", // 500 - Error interno del servidor
  "DATABASE_ERROR", // 500 - Error de base de datos
  "EXTERNAL_SERVICE_ERROR", // 502 - Error de servicio externo

  // ===== NETWORK ERRORS =====
  "NETWORK_ERROR", // 0 - No hay conexión a internet
  "TIMEOUT_ERROR", // 0 - La petición excedió el tiempo límite
  "RATE_LIMIT_EXCEEDED", // 429 - Se excedió el límite de peticiones
]);

/**
 * Tipo de código de error
 */
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/**
 * Schema para respuestas de error del backend
 *
 * El backend DEBE retornar esta estructura en todos los errores.
 */
export const ApiErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  status: z.number(),
  details: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
});

/**
 * Tipo inferido de error de API
 */
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Schema para respuestas de éxito sin datos (void operations)
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

/**
 * Tipo inferido de respuesta de éxito
 */
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
