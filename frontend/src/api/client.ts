import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";

/**
 * Cliente Axios configurado para la API de SIRES
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Agrega token JWT a todas las peticiones
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");

    if (config.headers.Authorization) {
      return config;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Maneja errores globales en las respuestas
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const apiError = {
      code: (error.response?.data as any)?.code || "UNKNOWN_ERROR",
      message:
        (error.response?.data as any)?.message || "Ocurrió un error inesperado",
      status: error.response?.status || 500,
    };

    // Si el error 401 viene de intentar iniciar sesión o cerrar, NO reintentar
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/logout")
    ) {
      return Promise.reject(apiError);
    }

    // Si es error 401 (token vencido) y no estamos reintentando ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");

        // Usamos axios base para evitar interceptores en el refresh
        const response = await axios.post(`${env.apiUrl}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem("access_token", access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.clear(); // Limpiamos todo
        window.location.href = "/login?expired=true";
        return Promise.reject({ ...apiError, code: "SESSION_EXPIRED" });
      }
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
