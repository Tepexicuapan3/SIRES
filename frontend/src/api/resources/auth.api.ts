/**
 * Auth API Resource
 *
 * Gestión de autenticación, sesiones y recuperación de cuentas.
 * Estos endpoints son públicos.
 */

import apiClient from "@api/client";
import { AxiosError } from "axios";
import Cookies from "js-cookie";
import { ApiError } from "@api/utils/errors";

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RequestResetCodeRequest,
  RequestResetCodeResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  VerifyTokenResponse,
  LogoutResponse,
  MeResponse,
} from "@api/types";

const ACCESS_TOKEN_COOKIE = "access_token_cookie";
const REFRESH_TOKEN_COOKIE = "refresh_token_cookie";
const CSRF_COOKIE = "csrf_token";
const MOCK_SESSION_COOKIE_DAYS = 7;

const isMswSessionMode =
  import.meta.env.DEV && import.meta.env.VITE_USE_MSW === "true";

const persistMockSessionCookies = (username: string) => {
  if (!isMswSessionMode) return;

  const tokenValue = encodeURIComponent(username);
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    expires: MOCK_SESSION_COOKIE_DAYS,
  };

  Cookies.set(ACCESS_TOKEN_COOKIE, tokenValue, cookieOptions);
  Cookies.set(REFRESH_TOKEN_COOKIE, tokenValue, cookieOptions);
  Cookies.set(CSRF_COOKIE, `csrf_${tokenValue}`, cookieOptions);
};

const clearMockSessionCookies = () => {
  if (!isMswSessionMode) return;

  Cookies.remove(ACCESS_TOKEN_COOKIE, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_COOKIE, { path: "/" });
  Cookies.remove(CSRF_COOKIE, { path: "/" });
};

const authAPI = {
  /**
   * Iniciar sesión en el sistema.
   *
   * @endpoint POST /api/v1/auth/login
   * @permission Public
   *
   * @param data - Credenciales (username y password)
   * @returns Token, datos de usuario y flag de onboarding
   * @throws Error si las credenciales son inválidas o la respuesta es malformada
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    persistMockSessionCookies(response.data.user.username);
    return response.data;
  },

  /**
   * Cerrar sesión actual.
   * Invalida el token en el servidor y limpia cookies.
   *
   * @endpoint POST /api/v1/auth/logout
   * @permission Auth (Token válido)
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>("/auth/logout");
    clearMockSessionCookies();
    return response.data;
  },

  /**
   * Obtener datos del usuario autenticado actual.
   * Se usa para hidratar la sesión al recargar la página.
   *
   * @endpoint GET /api/v1/auth/me
   * @permission Auth (Token válido)
   *
   * @returns Datos completos del usuario logueado
   */
  getCurrentUser: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return response.data;
  },

  /**
   * Verificar validez del token actual.
   * Útil para guardias de navegación o chequeos periódicos.
   *
   * @endpoint GET /api/v1/auth/verify
   * @permission Auth (Token válido)
   *
   * @returns true si el token es válido, false si es 401/403
   * @throws Error si ocurre un error de red o servidor (500)
   */
  verifyToken: async (): Promise<VerifyTokenResponse> => {
    try {
      await apiClient.get("/auth/verify");
      return { valid: true };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          return { valid: false };
        }

        throw error;
      }

      const axiosError = error as AxiosError;

      if (
        axiosError.response &&
        (axiosError.response.status === 401 ||
          axiosError.response.status === 403)
      ) {
        return { valid: false };
      }

      throw error;
    }
  },

  /**
   * Renovar el token de acceso usando el refresh token (vía cookies).
   *
   * @endpoint POST /api/v1/auth/refresh
   * @permission Public (Usa Cookie HTTP-Only)
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const response =
      await apiClient.post<RefreshTokenResponse>("/auth/refresh");
    return response.data;
  },

  // ===== ONBOARDING =====

  /**
   * Completar registro inicial (Onboarding).
   * Cambia contraseña temporal y acepta términos.
   *
   * @endpoint POST /api/v1/auth/complete-onboarding
   * @permission Auth (Token temporal válido)
   *
   * @param data - Nueva contraseña y aceptación de términos
   * @returns Nuevas credenciales definitivas
   */
  completeOnboarding: async (
    data: CompleteOnboardingRequest,
  ): Promise<CompleteOnboardingResponse> => {
    const response = await apiClient.post<CompleteOnboardingResponse>(
      "/auth/complete-onboarding",
      data,
    );
    persistMockSessionCookies(response.data.user.username);
    return response.data;
  },

  // ===== RESET PASSWORD =====

  /**
   * Solicitar código de recuperación de contraseña.
   * Envía un email con el código OTP.
   *
   * @endpoint POST /api/v1/auth/request-reset-code
   * @permission Public
   *
   * @param data - Email del usuario
   */
  requestResetCode: async (
    data: RequestResetCodeRequest,
  ): Promise<RequestResetCodeResponse> => {
    const response = await apiClient.post<RequestResetCodeResponse>(
      "/auth/request-reset-code",
      data,
    );
    return response.data;
  },

  /**
   * Verificar código OTP de recuperación.
   * Retorna un token temporal para cambiar la contraseña.
   *
   * @endpoint POST /api/v1/auth/verify-reset-code
   * @permission Public
   *
   * @param data - Email y Código OTP
   * @returns Token temporal válido para reset-password
   */
  verifyResetCode: async (
    data: VerifyResetCodeRequest,
  ): Promise<VerifyResetCodeResponse> => {
    const response = await apiClient.post<VerifyResetCodeResponse>(
      "/auth/verify-reset-code",
      data,
    );
    return response.data;
  },

  /**
   * Establecer nueva contraseña usando token de recuperación.
   *
   * @endpoint POST /api/v1/auth/reset-password
   * @permission Auth (Token de recuperación válido)
   *
   * @param data - Nueva contraseña
   * @returns Auto-login con las nuevas credenciales
   */
  resetPassword: async (
    data: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
      data,
    );
    persistMockSessionCookies(response.data.user.username);
    return response.data;
  },
};

export { authAPI };
