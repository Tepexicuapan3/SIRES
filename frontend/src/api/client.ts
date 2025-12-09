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
    // Si el error 401 viene de intentar iniciar sesión, NO hagas nada.
    if (originalRequest.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // Si es error 401 (token vencido) y NO es el endpoint de login
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${env.apiUrl}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;

        // Guardar nuevo token
        localStorage.setItem("access_token", access_token);

        // Reintentar request original con nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh (sesión expirada real), limpiar todo y redirigir
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
