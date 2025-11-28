import { useThemeStore, type Theme } from "../../../store/themeStore";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeStore();

  const options: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "system", icon: Monitor, label: "Sistema" },
    { value: "dark", icon: Moon, label: "Oscuro" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Etiqueta descriptiva */}
      <label className="text-sm font-semibold text-txt-body">Apariencia</label>

      {/* Contenedor del Control */}
      <div
        className="
        inline-flex p-1 rounded-xl
        bg-paper-lift border border-line-struct
        dark:bg-paper dark:border-line-hairline
        shadow-sm
      "
      >
        {options.map(({ value, icon: Icon, label }) => {
          const isActive = theme === value;

          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                // Clases Base
                "relative flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/20",

                // Estados Interactivos
                isActive
                  ? "bg-brand text-white shadow-md shadow-brand/20 scale-[1.02]" // Activo: Naranja Metro con leve elevación
                  : "text-txt-muted hover:text-txt-body hover:bg-subtle" // Inactivo: Sutil y limpio
              )}
              aria-pressed={isActive}
            >
              <Icon
                size={16}
                strokeWidth={2.5}
                className={isActive ? "animate-pulse-once" : ""}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Texto de ayuda dinámico */}
      <p className="text-xs text-txt-muted ml-1">
        {theme === "system"
          ? "Se ajustará automáticamente a la configuración de tu dispositivo."
          : `El sistema permanecerá en modo ${
              theme === "light" ? "claro" : "oscuro"
            }.`}
      </p>
    </div>
  );
};
