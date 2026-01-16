/**
 * Types para el sistema de autenticación
 *
 * IMPORTANTE: Estos tipos se importan desde los schemas de Zod.
 * Los schemas usan camelCase (estándar frontend/API), el backend hace el mapping.
 */

import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
  RefreshTokenResponse,
  RequestResetCodeRequest,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CompleteOnboardingRequest,
  VerifyTokenResponse,
} from "@api/schemas/auth.schema";

// ===== RE-EXPORTS =====

export type {
  LoginRequest,
  LoginResponse,
  AuthUser,
  RefreshTokenResponse,
  RequestResetCodeRequest,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CompleteOnboardingRequest,
  VerifyTokenResponse,
};

// ===== STORE TYPES =====

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ===== API INTERFACE =====

export interface IAuthAPI {
  login: (data: LoginRequest) => Promise<LoginResponse>;
  completeOnboarding: (
    data: CompleteOnboardingRequest,
  ) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<RefreshTokenResponse>;
  getCurrentUser: () => Promise<AuthUser>;
  verifyToken: () => Promise<VerifyTokenResponse>;
  requestResetCode: (data: RequestResetCodeRequest) => Promise<void>;
  verifyResetCode: (
    data: VerifyResetCodeRequest,
  ) => Promise<VerifyResetCodeResponse>;
  resetPassword: (data: ResetPasswordRequest) => Promise<ResetPasswordResponse>;
}
