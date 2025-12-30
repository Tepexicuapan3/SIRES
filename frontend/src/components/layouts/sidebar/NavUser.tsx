/**
 * NavUser.tsx
 *
 * Componente de usuario en el footer del sidebar.
 *
 * Características:
 * - Avatar con fallback de iniciales
 * - Dropdown con: Mi Perfil, Tema (submenu), Logout
 * - Theme toggle integrado con useThemeStore
 * - Logout con useLogout hook
 */

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useLogout } from "@features/auth/hooks/useLogout";

/**
 * Genera iniciales desde un nombre completo.
 * Toma la primera letra del primer nombre y la primera del apellido.
 * Si solo hay un nombre, toma las 2 primeras letras.
 * Ejemplo: "Juan Pérez" → "JP", "Admin" → "AD"
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "??";

  if (words.length === 1) {
    // Solo un nombre: tomar las 2 primeras letras
    return words[0].slice(0, 2).toUpperCase();
  }

  // Múltiples palabras: primera letra del primero y primera del último
  const first = words[0][0] || "";
  const last = words[words.length - 1][0] || "";
  return (first + last).toUpperCase();
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { logoutWithToast } = useLogout();

  if (!user) return null;

  const userInitials = getInitials(user.usuario || "U");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="" alt="" />
                <AvatarFallback
                  className="rounded-lg bg-app text-brand font-semibold"
                  aria-label={`Usuario ${user.usuario}`}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.usuario}</span>
                <span className="truncate text-xs text-txt-muted">
                  {user.roles?.[0] || "Usuario"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt="" />
                  <AvatarFallback
                    className="rounded-lg bg-app text-brand font-semibold"
                    aria-label={`Usuario ${user.usuario}`}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.usuario}</span>
                  <span className="truncate text-xs text-txt-muted">
                    {/* Aquí podríamos mostrar email si lo tuviéramos */}
                    {user.roles?.join(", ") || "Usuario"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="cursor-pointer">
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/notificaciones" className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  Notificaciones
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {theme === "light" && <Sun className="mr-2 h-4 w-4" />}
                {theme === "dark" && <Moon className="mr-2 h-4 w-4" />}
                {theme === "system" && <Monitor className="mr-2 h-4 w-4" />}
                Tema
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Claro
                  {theme === "light" && (
                    <Check className="ml-auto h-4 w-4 text-brand" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Oscuro
                  {theme === "dark" && (
                    <Check className="ml-auto h-4 w-4 text-brand" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  Sistema
                  {theme === "system" && (
                    <Check className="ml-auto h-4 w-4 text-brand" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutWithToast()}
              className="text-status-critical cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
