import apiClient from "../client";

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  Usuario,
} from "../types/auth.types";

/**
 * API de Autenticación
 */
export const authAPI = {
  /**
   * Login de usuario
   * POST /api/v1/auth/login
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
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
};
