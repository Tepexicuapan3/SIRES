import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Usuario } from "@api/types/auth.types";

interface AuthState {
  // Estado
  user: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones
  setAuth: (user: Usuario, token: string, refreshToken: string) => void;
  updateUser: (user: Partial<Usuario>) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
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
      isLoading: false,

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
          isLoading: false,
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

      // 3. Actualizar solo el token (sin tocar al usuario)
      setToken: (token) => {
        localStorage.setItem("access_token", token);
        set({ token });
      },

      // 4. Control manual de carga
      setLoading: (loading) => set({ isLoading: loading }),

      // Logout
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
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
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useUserRoles = () =>
  useAuthStore((state) => state.user?.roles || []);
export const useHasRole = (role: string) =>
  useAuthStore((state) => state.user?.roles.includes(role) || false);
