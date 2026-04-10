import { expect, type Page } from "@playwright/test";

const DEFAULT_AUTH_API_BASE_URL = "http://localhost:5000/api/v1";

const normalizeBaseUrl = (value: string): string => value.replace(/\/$/, "");

export const resolveApiBaseUrl = (origin?: string): string => {
  if (origin) {
    return `${normalizeBaseUrl(origin)}/api/v1`;
  }

  const fromEnv = process.env.PLAYWRIGHT_API_BASE_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  return DEFAULT_AUTH_API_BASE_URL;
};

export const waitForPasswordResetForm = async (page: Page) => {
  await expect(page.getByLabel("Nueva Contraseña")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByLabel("Confirmar Contraseña")).toBeVisible({
    timeout: 10_000,
  });
};

export const waitForSessionExpiredRedirect = async (page: Page) => {
  await expect.poll(() => page.url(), { timeout: 10_000 }).toContain("/login");
};
