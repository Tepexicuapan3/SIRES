import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sires-theme-preference";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Detectar preferencia del sistema
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Resolver tema efectivo
  const resolveTheme = (currentTheme: Theme): "light" | "dark" => {
    if (currentTheme === "system") {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Aplicar tema al DOM
  const applyTheme = (effectiveTheme: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);
    root.setAttribute("data-theme", effectiveTheme);
    setResolvedTheme(effectiveTheme);
  };

  // Cambiar tema
  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const effective = resolveTheme(newTheme);
    applyTheme(effective);
  };

  // Toggle simple entre light/dark
  const toggleTheme = () => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light";
    changeTheme(newTheme);
  };

  // Inicializar tema
  useEffect(() => {
    // 1. Verificar si hay preferencia guardada
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;

    // 2. Si hay preferencia guardada, usarla
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(resolveTheme(savedTheme));
    } else {
      // 3. Si no hay preferencia, usar tema del sistema
      const systemTheme = getSystemTheme();
      setTheme("system");
      applyTheme(systemTheme);
    }

    setMounted(true);

    // 4. Escuchar cambios en preferencia del sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        applyTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme: changeTheme,
    toggleTheme,
    mounted,
  };
};
