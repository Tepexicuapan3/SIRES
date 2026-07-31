/**
 * Variables de entorno tipadas del portal de Citas en Línea.
 *
 * Espejo simplificado de `frontend/src/app/config/env.ts` del proyecto
 * interno: mismo patrón (leer de `import.meta.env`, fallback a `/api/v1`
 * en desarrollo), pero sin las variables que el portal no necesita
 * (nombre/version de app, timeout configurable, etc. — YAGNI para 5
 * pantallas).
 */

const getApiUrl = (): string => {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured;
  }

  // En desarrollo, Vite proxea /api hacia el backend Django (ver
  // vite.config.ts -> server.proxy), así que no hace falta configurar nada.
  if (import.meta.env.DEV) {
    return "/api/v1";
  }

  throw new Error(
    "Falta configurar VITE_API_URL: el portal se sirve desde un dominio " +
      "separado del backend, así que en producción necesita la URL " +
      "completa (ej. https://api.sires.example.mx/api/v1)."
  );
};

export const env = {
  apiUrl: getApiUrl(),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
