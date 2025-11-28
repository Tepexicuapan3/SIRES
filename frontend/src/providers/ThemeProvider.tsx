import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;

    // Función para aplicar la clase
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    // Lógica principal
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

      // Aplicar estado actual del sistema
      applyTheme(systemTheme.matches);

      // Escuchar cambios en vivo del sistema
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      systemTheme.addEventListener("change", listener);

      return () => systemTheme.removeEventListener("change", listener);
    } else {
      // Manual: Light o Dark
      applyTheme(theme === "dark");
    }
  }, [theme]);

  return <>{children}</>;
}
