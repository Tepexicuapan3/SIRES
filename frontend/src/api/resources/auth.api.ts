import apiClient from "../client";
import { authMocks } from "../mocks/auth.mocks";

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  Usuario,
  RequestResetCodeRequest,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  CompleteOnboardingRequest,
} from "../types/auth.types";

// Leemos la variable de entorno para saber si usar Mocks
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

/**
 * API de Autenticación
 */
export const authAPI = {
  /**
   * Login de usuario
   * POST /api/v1/auth/login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    if (USE_MOCKS) return authMocks.login(data);
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  /**
   * Completar Onboarding (Primer cambio de contraseña y términos)
   * POST /api/v1/auth/complete-onboarding
   */
  completeOnboarding: async (data: CompleteOnboardingRequest) => {
    if (USE_MOCKS) return authMocks.completeOnboarding(data);
    return apiClient.post("/auth/complete-onboarding", data);
  },

  /**
   * Logout de usuario
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  /**
   * Refrescar access token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      }
    );
    return response.data;
  },

  /**
   * Obtener usuario actual
   * GET /api/v1/auth/me
   */
  getCurrentUser: async (): Promise<Usuario> => {
    const response = await apiClient.get<Usuario>("/auth/me");
    return response.data;
  },

  /**
   * Verificar si el token es válido
   * GET /api/v1/auth/verify
   */
  verifyToken: async (): Promise<boolean> => {
    try {
      await apiClient.get("/auth/verify");
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Solicitar código de reseteo de contraseña
   * POST /api/v1/auth/request-reset-code
   */
  requestResetCode: async (data: RequestResetCodeRequest) => {
    if (USE_MOCKS) return authMocks.requestResetCode(data);
    return apiClient.post("/auth/request-reset-code", data);
  },

  /**
   * Verificar código OTP
   * POST /api/v1/auth/verify-reset-code
   */
  verifyResetCode: async (
    data: VerifyResetCodeRequest
  ): Promise<VerifyResetCodeResponse> => {
    if (USE_MOCKS) return authMocks.verifyResetCode(data);
    const response = await apiClient.post<VerifyResetCodeResponse>(
      "/auth/verify-reset-code",
      data
    );
    return response.data;
  },

  /**
   * Cambiar contraseña final
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (data: ResetPasswordRequest) => {
    if (USE_MOCKS) return authMocks.resetPassword(data);
    return apiClient.post("/auth/reset-password", data);
  },
};
