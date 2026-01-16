/**
 * Permissions Schema
 *
 * Catálogo de permisos disponibles en el sistema.
 * Estrategia Code-First: Los permisos son estructurales y no se crean dinámicamente.
 * Basado en estándares definidos en: standards.md
 */

import { z } from "zod";

// ==========================================
// 1. ENTIDAD BASE (Permission)
// ==========================================

/**
 * Permiso
 * Formato jerárquico: GRUPO:MODULO:SUBMODULO:ACCION
 * Machea con la tabla cat_permissions de MySQL (después de conversión a camelCase en backend).
 */
export const PermissionSchema = z.object({
  id: z.number().int().positive("ID de permiso debe ser positivo"),
  codigo: z
    .string()
    .min(1, "Código de permiso es requerido")
    .max(255, "Código no puede tener más de 255 caracteres"),
  descripcion: z
    .string()
    .min(1, "Descripción de permiso es requerida")
    .max(500, "Descripción no puede tener más de 500 caracteres"),
});

/**
 * Tipo inferido de Permiso
 */
export type Permission = z.infer<typeof PermissionSchema>;

// ==========================================
// 2. REQUEST TYPES (Operaciones sobre roles)
// ==========================================

/**
 * Asignar Permiso a Rol Request
 * POST /api/v1/permissions/assign
 */
export const AssignPermissionRequestSchema = z.object({
  permissionId: z.number().int().positive("ID de permiso debe ser positivo"),
});

export type AssignPermissionRequest = z.infer<
  typeof AssignPermissionRequestSchema
>;

/**
 * Revocar Permiso de Rol Request
 * DELETE /api/v1/permissions/roles/:roleId/permissions/:permissionId
 */
export const RevokePermissionRequestSchema = z.object({
  permissionId: z.number().int().positive("ID de permiso debe ser positivo"),
});

export type RevokePermissionRequest = z.infer<
  typeof RevokePermissionRequestSchema
>;

// ==========================================
// 3. RESPONSE TYPES
// ==========================================

/**
 * Asignar Permiso Response
 */
export const AssignPermissionResponseSchema = z.object({
  message: z.string(),
  roleId: z.number(),
  permissionId: z.number(),
});

export type AssignPermissionResponse = z.infer<
  typeof AssignPermissionResponseSchema
>;

/**
 * Revocar Permiso Response
 */
export const RevokePermissionResponseSchema = z.object({
  message: z.string(),
});

export type RevokePermissionResponse = z.infer<
  typeof RevokePermissionResponseSchema
>;

/**
 * Catálogo de Permisos Response
 * GET /api/v1/permissions
 */
export const PermissionCatalogResponseSchema = z.object({
  items: z.array(PermissionSchema),
  total: z.number().int().nonnegative(),
});

export type PermissionCatalogResponse = z.infer<
  typeof PermissionCatalogResponseSchema
>;

// ==========================================
// 4. OVERRIDES (Permisos de usuario específicos)
// ==========================================

/**
 * Override de Permiso para Usuario
 * Excepción de permiso: Allow/Deny para un usuario específico.
 * Machea con la tabla user_permission_overrides de MySQL (después de conversión a camelCase en backend).
 */
export const UserPermissionOverrideSchema = z.object({
  id: z.number().int().positive("ID de override debe ser positivo"),
  codigoPermiso: z
    .string()
    .min(1, "Código de permiso es requerido")
    .max(255, "Código no puede tener más de 255 caracteres"),
  descripcionPermiso: z
    .string()
    .min(1, "Descripción de permiso es requerida")
    .max(500, "Descripción no puede tener más de 500 caracteres"),
  effect: z.enum(["ALLOW", "DENY"]),
  expiraEn: z.string().datetime().nullable(),
  expirado: z.boolean(),
  asignadoEn: z.string().datetime(),
  asignadoPor: z.string(),
});

/**
 * Tipo inferido de Override de Permiso
 */
export type UserPermissionOverride = z.infer<
  typeof UserPermissionOverrideSchema
>;

/**
 * Agregar Override Request
 * POST /api/v1/users/:userId/overrides
 */
export const AddUserOverrideRequestSchema = z.object({
  permissionCode: z
    .string()
    .min(1, "Código de permiso es requerido")
    .max(255, "Código no puede tener más de 255 caracteres"),
  effect: z.enum(["ALLOW", "DENY"]),
  expiraEn: z.string().datetime().optional(),
});

export type AddUserOverrideRequest = z.infer<
  typeof AddUserOverrideRequestSchema
>;

/**
 * Agregar Override Response
 */
export const AddUserOverrideResponseSchema = z.object({
  message: z.string(),
  userId: z.number(),
  permissionCode: z.string(),
  effect: z.enum(["ALLOW", "DENY"]),
});

export type AddUserOverrideResponse = z.infer<
  typeof AddUserOverrideResponseSchema
>;

/**
 * Response de get user overrides
 */
export const UserOverridesResponseSchema = z.object({
  userId: z.number(),
  overrides: z.array(UserPermissionOverrideSchema),
});

export type UserOverridesResponse = z.infer<typeof UserOverridesResponseSchema>;
