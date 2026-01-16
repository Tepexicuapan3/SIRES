// URL helper para MSW
// Usamos un patrón wildcard al inicio (*) para que coincida con cualquier host/prefijo
// y aseguramos que coincida con el path específico.

/**
 * Genera un matcher flexible.
 * - getApiUrl("users") -> "*\/users"
 * Esto atrapará:
 * - http://localhost:5000/api/v1/users
 * - http://localhost:5000/users
 * Pero también podría atrapar archivos estáticos si no tenemos cuidado (se maneja en handlers.ts)
 */
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `*/${cleanPath}`;
};
