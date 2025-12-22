import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility para combinar clases de Tailwind CSS
 * Usa clsx para condicionales y twMerge para resolver conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper para obtener el valor de una cookie por nombre
 * 
 * @param name - Nombre de la cookie a buscar
 * @returns El valor de la cookie o null si no existe
 * 
 * @example
 * ```ts
 * const csrfToken = getCookie('csrf_access_token');
 * const userId = getCookie('user_id');
 * ```
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  
  return null;
}

