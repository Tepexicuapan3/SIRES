/**
 * Users Schema
 *
 * Gestión completa de usuarios dividida en sub-recursos lógicos.
 * Basado en estándares definidos en: ../standards.md
 */

import { z } from "zod";
import {
  PaginationParamsSchema,
  ListResponseSchema,
  SuccessResponseSchema,
} from "./common/pagination.schema";

// ==========================================
// 1. ENTIDAD BASE (Modelos de DB)
// ==========================================

/**
 * User entity - Nomenclatura del backend (MySQL)
 * Base común para AuthUser y User (CRUD).
 * Campos convertidos de snake_case a camelCase.
 */
export const UserSchema = z.object({
  id: z.number().int().positive("ID de usuario debe ser positivo"),
  usuario: z
    .string()
    .min(3, "Usuario debe tener al menos 3 caracteres")
    .max(50, "Usuario no puede tener más de 50 caracteres"),
  nombre: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre no puede tener más de 100 caracteres"),
  paterno: z
    .string()
    .min(2, "Apellido paterno debe tener al menos 2 caracteres")
    .max(100, "Apellido paterno no puede tener más de 100 caracteres"),
  materno: z
    .string()
    .min(2, "Apellido materno debe tener al menos 2 caracteres")
    .max(100, "Apellido materno no puede tener más de 100 caracteres"),
  expediente: z.string().nullable(),
  idClinica: z.number().nullable(),
  correo: z.string().email("Correo electrónico inválido"),
  rolPrimario: z.string().min(1, "Rol primario es requerido"),
  isActive: z.boolean(),
  ultimaConexion: z.string().datetime().nullable(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User con metadatos de auditoría completos
 */
export const UserDetailSchema = UserSchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
  creadoPor: z.number(),
  actualizadoPor: z.number().nullable(),
  terminosAcept: z.boolean(),
  cambiarClave: z.boolean(),
  ipUltima: z.string().nullable(),
});

export type UserDetail = z.infer<typeof UserDetailSchema>;

// ==========================================
// 2. REQUEST / RESPONSE TYPES (Operaciones)
// ==========================================

// --- CORE CRUD ---

export const CreateUserRequestSchema = z.object({
  usuario: z
    .string()
    .min(3, "Usuario debe tener al menos 3 caracteres")
    .max(50, "Usuario no puede tener más de 50 caracteres"),
  expediente: z.string().min(1, "Expediente es requerido"),
  nombre: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre no puede tener más de 100 caracteres"),
  paterno: z
    .string()
    .min(2, "Apellido paterno debe tener al menos 2 caracteres")
    .max(100, "Apellido paterno no puede tener más de 100 caracteres"),
  materno: z
    .string()
    .min(2, "Apellido materno debe tener al menos 2 caracteres")
    .max(100, "Apellido materno no puede tener más de 100 caracteres"),
  idClinica: z.number().nullable(),
  correo: z.string().email("Correo electrónico inválido"),
  rolPrimario: z.number().int().positive("ID de rol primario es requerido"),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const CreateUserResponseSchema = z.object({
  id: z.number().int().positive(),
  usuario: z.string(),
  tempPassword: z.string(),
});

export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

export const UpdateUserRequestSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  paterno: z.string().min(2).max(100).optional(),
  materno: z.string().min(2).max(100).optional(),
  correo: z.string().email().optional(),
  idClinica: z.number().nullable().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const UpdateUserResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
  user: UserSchema,
});

export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;

export const UserStatusResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
  user: UserSchema,
});

export type UserStatusResponse = z.infer<typeof UserStatusResponseSchema>;

// --- LISTADOS ---

export const UsersListParamsSchema = PaginationParamsSchema.extend({
  isActive: z.boolean().optional(),
});

export type UsersListParams = z.infer<typeof UsersListParamsSchema>;

export const UsersListResponseSchema = ListResponseSchema(UserSchema);

export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;

// --- DETALLE ---

export const UserDetailResponseSchema = z.object({
  user: UserDetailSchema,
  roles: z.array(
    z.object({
      id: z.number(),
      nombre: z.string(),
      descripcion: z.string(),
      isPrimary: z.boolean(),
      asignadoEn: z.string().datetime(),
      asignadoPor: z.string(),
    }),
  ),
  overrides: z.array(
    z.object({
      id: z.number(),
      codigoPermiso: z.string(),
      descripcionPermiso: z.string(),
      effect: z.enum(["ALLOW", "DENY"]),
      expiraEn: z.string().datetime().nullable(),
      expirado: z.boolean(),
      asignadoEn: z.string().datetime(),
      asignadoPor: z.string(),
    }),
  ),
});

export type UserDetailResponse = z.infer<typeof UserDetailResponseSchema>;

// --- SUB-RECURSO: ROLES ---

export const UserRolesListResponseSchema = z.object({
  userId: z.number(),
  roles: z.array(
    z.object({
      id: z.number(),
      nombre: z.string(),
      descripcion: z.string(),
      isPrimary: z.boolean(),
      asignadoEn: z.string().datetime(),
      asignadoPor: z.string(),
    }),
  ),
});

export type UserRolesListResponse = z.infer<typeof UserRolesListResponseSchema>;

export const AssignRolesRequestSchema = z.object({
  roleIds: z
    .array(z.number().int().positive("ID de rol debe ser positivo"))
    .min(1, "Al menos un rol es requerido"),
});

export type AssignRolesRequest = z.infer<typeof AssignRolesRequestSchema>;

export const AssignRolesResponseSchema = z.object({
  message: z.string(),
  userId: z.number(),
  assignedCount: z.number(),
  roleIds: z.array(z.number()),
});

export type AssignRolesResponse = z.infer<typeof AssignRolesResponseSchema>;

export const SetPrimaryRoleRequestSchema = z.object({
  roleId: z.number().int().positive("ID de rol debe ser positivo"),
});

export type SetPrimaryRoleRequest = z.infer<typeof SetPrimaryRoleRequestSchema>;

export const SetPrimaryRoleResponseSchema = z.object({
  message: z.string(),
  userId: z.number(),
  roleId: z.number(),
});

export type SetPrimaryRoleResponse = z.infer<
  typeof SetPrimaryRoleResponseSchema
>;

export const RevokeRoleResponseSchema = z.object({
  message: z.string(),
  userId: z.number(),
  revokedRoleId: z.number(),
});

export type RevokeRoleResponse = z.infer<typeof RevokeRoleResponseSchema>;

// --- SUB-RECURSO: OVERRIDES ---

export const UserOverridesResponseSchema = z.object({
  userId: z.number(),
  overrides: z.array(
    z.object({
      id: z.number(),
      codigoPermiso: z.string(),
      descripcionPermiso: z.string(),
      effect: z.enum(["ALLOW", "DENY"]),
      expiraEn: z.string().datetime().nullable(),
      expirado: z.boolean(),
      asignadoEn: z.string().datetime(),
      asignadoPor: z.string(),
    }),
  ),
});

export type UserOverridesResponse = z.infer<typeof UserOverridesResponseSchema>;

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

export const AddUserOverrideResponseSchema = z.object({
  message: z.string(),
  userId: z.number(),
  permissionCode: z.string(),
  effect: z.enum(["ALLOW", "DENY"]),
});

export type AddUserOverrideResponse = z.infer<
  typeof AddUserOverrideResponseSchema
>;
