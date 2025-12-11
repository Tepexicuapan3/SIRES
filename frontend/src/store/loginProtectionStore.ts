import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LoginProtectionState {
  failedAttempts: number;
  lockoutUntil: number | null; // Timestamp (Date.now())

  // Acciones
  recordFailure: () => void;
  resetProtection: () => void;

  // Getters (Computados)
  isLocked: () => boolean;
  getRemainingTime: () => number; // Devuelve segundos restantes
}

const MAX_ATTEMPTS = 7;
const BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutos

export const useLoginProtectionStore = create<LoginProtectionState>()(
  persist(
    (set, get) => ({
      failedAttempts: 0,
      lockoutUntil: null,

      recordFailure: () => {
        const currentAttempts = get().failedAttempts + 1;
        let newLockoutUntil = get().lockoutUntil;

        // Si superamos el límite, calculamos el castigo
        if (currentAttempts >= MAX_ATTEMPTS) {
          // Factor de multiplicador:
          // Intento 10: x1 (5 min)
          // Intento 11: x2 (10 min)
          // Intento 12: x3 (15 min)
          const multiplier = currentAttempts - MAX_ATTEMPTS + 1;
          newLockoutUntil = Date.now() + BASE_LOCKOUT_MS * multiplier;
        }

        set({
          failedAttempts: currentAttempts,
          lockoutUntil: newLockoutUntil,
        });
      },

      resetProtection: () => {
        set({ failedAttempts: 0, lockoutUntil: null });
      },

      isLocked: () => {
        const { lockoutUntil } = get();
        if (!lockoutUntil) return false;
        return Date.now() < lockoutUntil;
      },

      getRemainingTime: () => {
        const { lockoutUntil } = get();
        if (!lockoutUntil) return 0;
        const remaining = lockoutUntil - Date.now();
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
      },
    }),
    {
      name: "sires-security-audit", // Nombre discreto en localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
