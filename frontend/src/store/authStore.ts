import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser } from "@api/types/auth.types";

interface AuthState {
  // Estado
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean; // Nuevo flag para disparar redirección suave

  // Acciones
  setAuth: (user: AuthUser) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
  setSessionExpired: (expired: boolean) => void; // Acción para client.ts
  logout: () => void;
}

/**
 * Store global de autenticación
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isSessionExpired: false,

      setAuth: (user) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isSessionExpired: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setSessionExpired: (expired) => set({ isSessionExpired: expired }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isSessionExpired: false, // Resetear flag al salir voluntariamente
        });
      },
    }),
    {
      name: "sires-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // No persistimos isSessionExpired, queremos que se resetee al recargar
      }),
    },
  ),
);
