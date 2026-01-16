/**
 * Roles Schema
 *
 * Gestión centralizada de Roles y sus Permisos.
 * Basado en estándares definidos en: standards.md
 */

import { z } from "zod";
import {
  PaginationParamsSchema,
  type PaginationParams,
} from "./common/pagination.schema";
import {
  SuccessResponseSchema,
  type SuccessResponse,
} from "./common/error.schema";

// ==========================================
// 1. ENTIDAD BASE (Role)
// ==========================================

/**
 * Entidad Role
 * Machea con la tabla cat_roles de MySQL (después de conversión a camelCase en backend).
 */
export const RoleSchema = z.object({
  id: z.number().int().positive("ID de rol debe ser positivo"),
  nombre: z
    .string()
    .min(1, "Nombre de rol es requerido")
    .max(50, "Nombre no puede tener más de 50 caracteres"),
  descripcion: z
    .string()
    .min(1, "Descripción de rol es requerido")
    .max(255, "Descripción no puede tener más de 255 caracteres"),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  landingRoute: z
    .string()
    .max(255, "Ruta de aterrizaje no puede tener más de 255 caracteres")
    .default("/inicio"),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  updatedAt: z.string().datetime().nullable(),
  updatedBy: z.string().nullable(),
});

/**
 * Tipo inferido de Role
 */
export type Role = z.infer<typeof RoleSchema>;

/**
 * Role con contadores de permisos y usuarios
 * Usado en vistas de lista
 */
export const RoleWithCountSchema = RoleSchema.extend({
  permissionsCount: z.number().int().nonnegative(),
  usersCount: z.number().int().nonnegative(),
});

/**
 * Tipo inferido de Role con contadores
 */
export type RoleWithCount = z.infer<typeof RoleWithCountSchema>;

// ==========================================
// 2. REQUEST TYPES (Operaciones)
// ==========================================

/**
 * Crear Role Request
 * POST /api/v1/roles
 */
export const CreateRoleRequestSchema = z.object({
  nombre: z
    .string()
    .min(1, "Nombre de rol es requerido")
    .max(50, "Nombre no puede tener más de 50 caracteres"),
  descripcion: z
    .string()
    .min(1, "Descripción de rol es requerido")
    .max(255, "Descripción no puede tener más de 255 caracteres"),
  landingRoute: z
    .string()
    .max(255, "Ruta de aterrizaje no puede tener más de 255 caracteres")
    .optional(),
});

export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;

/**
 * Crear Role Response (Minimal)
 */
export const CreateRoleResponseSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
});

export type CreateRoleResponse = z.infer<typeof CreateRoleResponseSchema>;

/**
 * Actualizar Role Request
 * PUT /api/v1/roles/:id
 */
export const UpdateRoleRequestSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  descripcion: z.string().min(1).max(255).optional(),
  landingRoute: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

/**
 * Actualizar Role Response
 */
export const UpdateRoleResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
  role: RoleSchema,
});

export type UpdateRoleResponse = z.infer<typeof UpdateRoleResponseSchema>;

/**
 * Asignar Permisos a Rol Request
 * POST /api/v1/permissions/assign
 */
export const AssignPermissionsRequestSchema = z.object({
  roleId: z.number().int().positive("ID de rol debe ser positivo"),
  permissionIds: z
    .array(z.number().int().positive("ID de permiso debe ser positivo"))
    .min(1, "Al menos un permiso es requerido"),
});

export type AssignPermissionsRequest = z.infer<
  typeof AssignPermissionsRequestSchema
>;

/**
 * Asignar Permisos Response
 */
export const AssignPermissionsResponseSchema = z.object({
  message: z.string(),
  roleId: z.number(),
  permissionIds: z.array(z.number()),
});

export type AssignPermissionsResponse = z.infer<
  typeof AssignPermissionsResponseSchema
>;

// ==========================================
// 3. RESPONSE TYPES (Listados y Detalle)
// ==========================================

/**
 * Query params para GET /api/v1/roles
 */
export const RolesListParamsSchema = PaginationParamsSchema.extend({
  isActive: z.boolean().optional(),
});

export type RolesListParams = z.infer<typeof RolesListParamsSchema>;

/**
 * Response para GET /api/v1/roles (Paginado)
 */
export const RolesListResponseSchema = z.object({
  items: z.array(RoleWithCountSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export type RolesListResponse = z.infer<typeof RolesListResponseSchema>;

/**
 * Response para GET /api/v1/roles/:id
 */
export const RoleDetailResponseSchema = z.object({
  role: RoleSchema,
  permissions: z.array(
    z.object({
      id: z.number().int().positive(),
      code: z.string(),
      descripcion: z.string(),
      assignedBy: z.string(),
      assignedAt: z.string().datetime(),
    }),
  ),
  permissionsCount: z.number().int().nonnegative(),
});

export type RoleDetailResponse = z.infer<typeof RoleDetailResponseSchema>;

/**
 * Response para DELETE /api/v1/roles/:id (Void)
 */
export const DeleteRoleResponseSchema = SuccessResponseSchema;

export type DeleteRoleResponse = z.infer<typeof DeleteRoleResponseSchema>;
