import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Usuario } from "@api/types/auth.types";

interface AuthState {
  // Estado
  user: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Acciones
  setAuth: (user: Usuario, token: string, refreshToken: string) => void;
  updateUser: (user: Partial<Usuario>) => void;
  logout: () => void;
  clearAuth: () => void;
}

/**
 * Store global de autenticación
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // Setear autenticación completa
      setAuth: (user, token, refreshToken) => {
        // Guardar tokens en localStorage también (para el interceptor)
        localStorage.setItem("access_token", token);
        localStorage.setItem("refresh_token", refreshToken);

        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      // Actualizar datos del usuario
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // Limpiar auth (por errores)
      clearAuth: () => {
        get().logout();
      },
    }),
    {
      name: "sires-auth-storage", // Nombre en localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectores útiles
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useUserRoles = () =>
  useAuthStore((state) => state.user?.roles || []);
export const useHasRole = (role: string) =>
  useAuthStore((state) => state.user?.roles.includes(role) || false);
