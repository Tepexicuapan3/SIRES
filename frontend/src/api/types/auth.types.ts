import type { BaseUser } from "./users.types";

/**
 * Types para el sistema de autenticación
 */

// ===== REQUEST TYPES =====
export interface LoginRequest {
  usuario: string;
  clave: string;
}

// ===== RESPONSE TYPES =====
export interface AuthUser extends BaseUser {
  roles: string[]; // Lista de códigos de roles ['ADMINISTRADOR', 'MEDICOS']
  permissions: string[]; // Permisos efectivos: ["expedientes:read", ...] o ["*"]
  landing_route: string; // Ruta post-login
  must_change_password: boolean;
}

/**
 * Login Response
 * Con HttpOnly cookies, los tokens NO vienen en el body.
 */
export interface LoginResponse {
  user: AuthUser;
  requires_onboarding?: boolean; // Flag para usuarios nuevos
}

export interface RefreshTokenResponse {
  code: string;
  message: string;
}

// ===== ERROR TYPES =====
export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ===== STORE TYPES =====
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ===== PAYLOAD TYPES =====
export interface RequestResetCodeRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  valid: boolean;
}

export interface ResetPasswordRequest {
  new_password: string;
}

export type ResetPasswordResponse = LoginResponse;

export interface CompleteOnboardingRequest {
  new_password: string;
  terms_accepted: boolean;
}

export type CompleteOnboardingResponse = LoginResponse;

// ===== API INTERFACE =====

export interface IAuthAPI {
  login: (data: LoginRequest) => Promise<LoginResponse>;
  completeOnboarding: (
    data: CompleteOnboardingRequest
  ) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<RefreshTokenResponse>;
  getCurrentUser: () => Promise<AuthUser>;
  verifyToken: () => Promise<boolean>;
  requestResetCode: (data: RequestResetCodeRequest) => Promise<void>;
  verifyResetCode: (
    data: VerifyResetCodeRequest
  ) => Promise<VerifyResetCodeResponse>;
  resetPassword: (data: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
}
