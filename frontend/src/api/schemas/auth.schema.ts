/**
 * Auth Schema
 *
 * Schemas para autenticación, sesiones y recuperación de cuentas.
 * Basado en estándares definidos en: ../standards.md
 */

import { z } from "zod";
import { SuccessResponseSchema } from "./common/response.schema";

// ==========================================
// 1. ENTIDAD BASE (Base User)
// ==========================================

/**
 * Usuario base compartido entre Auth y Users.
 * Campos del backend convertidos de snake_case a camelCase.
 */
export const BaseUserSchema = z.object({
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
});

/**
 * Tipo inferido de usuario base
 */
export type BaseUser = z.infer<typeof BaseUserSchema>;

// ==========================================
// 2. REQUEST TYPES
// ==========================================

/**
 * Login Request
 */
export const LoginRequestSchema = z.object({
  usuario: z.string().min(1, "Usuario es requerido"),
  clave: z.string().min(8, "Clave debe tener al menos 8 caracteres"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Request Reset Code Request
 */
export const RequestResetCodeRequestSchema = z.object({
  correo: z.string().email("Correo electrónico inválido"),
});

export type RequestResetCodeRequest = z.infer<
  typeof RequestResetCodeRequestSchema
>;

/**
 * Verify Reset Code Request
 */
export const VerifyResetCodeRequestSchema = z.object({
  correo: z.string().email("Correo electrónico inválido"),
  code: z
    .string()
    .min(4, "Código debe tener al menos 4 caracteres")
    .max(10, "Código no puede tener más de 10 caracteres"),
});

export type VerifyResetCodeRequest = z.infer<
  typeof VerifyResetCodeRequestSchema
>;

/**
 * Reset Password Request
 */
export const ResetPasswordRequestSchema = z.object({
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña no puede tener más de 255 caracteres"),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/**
 * Complete Onboarding Request
 */
export const CompleteOnboardingRequestSchema = z.object({
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña no puede tener más de 255 caracteres"),
  termsAccepted: z.boolean(),
});

export type CompleteOnboardingRequest = z.infer<
  typeof CompleteOnboardingRequestSchema
>;

// ==========================================
// 3. RESPONSE TYPES
// ==========================================

/**
 * Auth User (Usuario autenticado con roles y permisos)
 */
export const AuthUserSchema = BaseUserSchema.extend({
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  landingRoute: z.string(),
  mustChangePassword: z.boolean(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

/**
 * Login Response
 * Con HttpOnly cookies, los tokens NO vienen en el body.
 */
export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  requiresOnboarding: z.boolean().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Refresh Token Response
 */
export const RefreshTokenResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

/**
 * Verify Reset Code Response
 */
export const VerifyResetCodeResponseSchema = z.object({
  valid: z.boolean(),
});

export type VerifyResetCodeResponse = z.infer<
  typeof VerifyResetCodeResponseSchema
>;

/**
 * Logout Response (Void)
 */
export const LogoutResponseSchema = SuccessResponseSchema;

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

/**
 * Reset Password Response (Auto-login)
 */
export type ResetPasswordResponse = LoginResponse;

/**
 * Complete Onboarding Response (Auto-login)
 */
export type CompleteOnboardingResponse = LoginResponse;
