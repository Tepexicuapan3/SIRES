import type { BaseUser, AuthUser } from "@/api/types/auth.types"; 
// Nota: Importamos BaseUser de auth.types temporalmente si se re-exporta, 
// o mejor directamente de users.types para evitar ciclos.
import type { BaseUser as IBaseUser } from "@/api/types/users.types";

/**
 * Calcula el nombre completo de un usuario
 * Formato: Nombre Paterno Materno
 */
export const getUserFullName = (user: IBaseUser | null | undefined): string => {
  if (!user) return "";
  return `${user.nombre} ${user.paterno} ${user.materno}`.trim();
};

/**
 * Verifica si un usuario tiene permisos de administrador (Superusuario)
 * Basado en el permiso comodín '*'
 */
export const isUserAdmin = (user: AuthUser | null | undefined): boolean => {
  if (!user?.permissions) return false;
  return user.permissions.includes("*");
};

/**
 * Verifica si un usuario tiene un permiso específico
 */
export const hasPermission = (user: AuthUser | null, permission: string): boolean => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return user.permissions.includes(permission);
};
