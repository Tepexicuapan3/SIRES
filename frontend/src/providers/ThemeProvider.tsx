import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

/**
 * Aplica el tema global usando la clase `dark` en <html>.
 *
 * Razon industria:
 * - Permite CSS basado en clase y evita recomponer estilos por componente.
 * - Centraliza el comportamiento de tema en un solo punto.
 */
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

    let systemTheme: MediaQueryList | null = null;
    let listener: ((event: MediaQueryListEvent) => void) | null = null;

    if (theme === "system") {
      systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

      // Aplicar estado actual del sistema
      applyTheme(systemTheme.matches);

      // Escuchar cambios en vivo del sistema
      listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      systemTheme.addEventListener("change", listener);
    } else {
      // Manual: Light o Dark
      applyTheme(theme === "dark");
    }

    return () => {
      if (systemTheme && listener) {
        systemTheme.removeEventListener("change", listener);
      }
    };
  }, [theme]);

  return <>{children}</>;
}
