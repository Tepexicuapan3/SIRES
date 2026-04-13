import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resetTheme: () => void;
}

const INITIAL_STATE = {
  theme: "system" as Theme,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: INITIAL_STATE.theme,
      setTheme: (theme) => set({ theme }),
      resetTheme: () => set({ theme: INITIAL_STATE.theme }),
    }),
    {
      name: "sisem-theme-storage",
    },
  ),
);
