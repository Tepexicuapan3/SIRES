import apiClient from "@api/client";

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
  RequestResetCodeRequest,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CompleteOnboardingRequest,
  IAuthAPI,
} from "../types/auth.types";

/**
 * Implementación de la API de autenticación
 */

const authAPI: IAuthAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return response.data;
  },

  verifyToken: async (): Promise<boolean> => {
    try {
      await apiClient.get("/auth/verify");
      return true;
    } catch {
      return false;
    }
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh"
    );
    return response.data;
  },

  /**
   * Onboarding (Primer login)
   */

  completeOnboarding: async (
    data: CompleteOnboardingRequest
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/complete-onboarding",
      data
    );
    return response.data;
  },

  /**
   * Reseteo de contraseña
   */

  requestResetCode: async (data: RequestResetCodeRequest): Promise<void> => {
    await apiClient.post("/auth/request-reset-code", data);
  },

  verifyResetCode: async (
    data: VerifyResetCodeRequest
  ): Promise<VerifyResetCodeResponse> => {
    const response = await apiClient.post<VerifyResetCodeResponse>(
      "/auth/verify-reset-code",
      data
    );
    return response.data;
  },

  resetPassword: async (
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
      { new_password: data.new_password }
    );
    return response.data;
  },
};

export { authAPI };
