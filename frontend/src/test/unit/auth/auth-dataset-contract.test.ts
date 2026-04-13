import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AUTH_DATASET_VERSION,
  AUTH_E2E_CANONICAL_DATASET,
  getScenarioCredentials,
} from "@/test/e2e/auth/auth-dataset";

const readFromFrontendRoot = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("auth dataset contract (KAN-89)", () => {
  it("exposes a versioned canonical dataset", () => {
    expect(AUTH_DATASET_VERSION).toBeTruthy();
    expect(AUTH_E2E_CANONICAL_DATASET.version).toBe(AUTH_DATASET_VERSION);
    expect(AUTH_E2E_CANONICAL_DATASET.password).toBe("Sisem_123456");
  });

  it("maps critical KAN-92 scenarios for backend-real and hybrid", () => {
    const criticalScenarios = [
      "admin_success",
      "invalid_password",
      "inactive_user",
      "blocked_user",
      "onboarding_user",
      "password_reset_user",
    ] as const;

    for (const scenarioKey of criticalScenarios) {
      const backendReal = getScenarioCredentials("backend-real", scenarioKey);
      const hybrid = getScenarioCredentials("hybrid", scenarioKey);

      expect(backendReal.username).toBeTruthy();
      expect(hybrid.username).toBeTruthy();
      expect(backendReal.password).toBe(AUTH_E2E_CANONICAL_DATASET.password);
      expect(hybrid.password).toBe(AUTH_E2E_CANONICAL_DATASET.password);
    }
  });

  it("keeps e2e and msw consumers aligned to auth-dataset.ts", () => {
    const e2eSpec = readFromFrontendRoot("src/test/e2e/auth/auth.e2e.ts");
    const authHandlers = readFromFrontendRoot(
      "src/test/mocks/handlers/auth.ts",
    );

    expect(e2eSpec).toContain("auth-dataset");
    expect(e2eSpec).not.toContain("const TEST_USERS = {");
    expect(e2eSpec).not.toContain("const EMAILS = {");

    expect(authHandlers).toContain("auth-dataset");
    expect(authHandlers).not.toContain('username === "locked"');
    expect(authHandlers).not.toContain('username === "inactive"');
  });
});
