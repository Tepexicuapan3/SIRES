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
  ResetPasswordResponse,
  CompleteOnboardingRequest,
  IAuthAPI,
} from "../types/auth.types";

// Leemos la variable de entorno para saber si usar Mocks
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

/**
 * Implementación Real de la API
 */
const realAuthAPI: IAuthAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  completeOnboarding: async (
    data: CompleteOnboardingRequest
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/complete-onboarding",
      data
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      }
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<Usuario> => {
    const response = await apiClient.get<Usuario>("/auth/me");
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

  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
      { new_password: data.new_password },
      {
        headers: {
          Authorization: `Bearer ${data.reset_token}`,
        },
      }
    );
    return response.data;
  },
};

/**
 * Exportamos la API según el entorno.
 * Si USE_MOCKS es true, usamos el objeto de mocks, sino el real.
 */
export const authAPI: IAuthAPI = USE_MOCKS ? authMocks : realAuthAPI;
