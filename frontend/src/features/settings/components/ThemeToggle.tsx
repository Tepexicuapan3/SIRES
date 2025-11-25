import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeContext } from "@/providers/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeContext();

  const themes = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Oscuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${
              theme === value
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }
          `}
          aria-label={`Cambiar a tema ${label}`}
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
