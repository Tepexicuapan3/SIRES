/**
 * Variables de entorno tipadas y validadas
 */

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  // API
  apiUrl: getEnvVar("VITE_API_URL", "http://localhost:5000/api/v1"),

  // App
  appName: getEnvVar("VITE_APP_NAME", "SIRES"),
  appVersion: getEnvVar("VITE_APP_VERSION", "1.0.0"),

  // Flags
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  // Timeouts
  apiTimeout: 30000,
  tokenRefreshInterval: 5 * 60 * 1000, // 5 minutos
} as const;
