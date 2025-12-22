import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Usuario } from "@api/types/auth.types";

interface AuthState {
  // Estado - Ya no almacenamos tokens (están en HttpOnly cookies)
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones
  setAuth: (user: Usuario) => void;
  updateUser: (user: Partial<Usuario>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  clearAuth: () => void;
}

/**
 * Store global de autenticación
 * 
 * IMPORTANTE: Los tokens JWT están en HttpOnly cookies (no accesibles desde JS)
 * Este store solo mantiene los datos del usuario para la UI
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Setear autenticación después de login exitoso
       * Los tokens ya están en cookies HttpOnly (seteados por el backend)
       */
      setAuth: (user) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Actualizar datos del usuario
       */
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      /**
       * Control manual de estado de carga
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Logout - Limpia el estado local
       * NOTA: El backend elimina las cookies en /auth/logout
       */
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      /**
       * Limpiar auth (por errores o sesión expirada)
       */
      clearAuth: () => {
        get().logout();
      },
    }),
    {
      name: "sires-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir datos del usuario (NO tokens - están en cookies)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectores útiles
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useUserRoles = () =>
  useAuthStore((state) => state.user?.roles || []);
export const useHasRole = (role: string) =>
  useAuthStore((state) => state.user?.roles.includes(role) || false);
