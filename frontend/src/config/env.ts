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

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid environment variable: ${key}`);
  }

  return parsed;
};

export const env = {
  // API
  apiUrl: getEnvVar("VITE_API_URL"),

  // App
  appName: getEnvVar("VITE_APP_NAME"),
  appVersion: getEnvVar("VITE_APP_VERSION"),

  // Flags
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  // Timeouts
  apiTimeout: getEnvNumber("VITE_API_TIMEOUT", 3000),
  tokenRefreshInterval: 5 * 60 * 1000, // 5 minutos
} as const;
