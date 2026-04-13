import { test, expect, type APIRequestContext } from "@playwright/test";
import type { LoginResponse, MeResponse } from "@api/types/auth.types";
import { AuthPage, AuthAPI } from "./auth-page";
import { resetAuthE2EHarness } from "./auth-harness";
import {
  AUTH_TEST_EMAILS,
  getAuthE2ETestUsers,
  getResetEmail,
  type AuthHarnessMode,
} from "./auth-dataset";
import {
  resolveApiBaseUrl,
  waitForPasswordResetForm,
  waitForSessionExpiredRedirect,
} from "./auth-test-env";

const PLAYWRIGHT_APP_ORIGIN =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const ENABLE_TEST_OTP = Boolean(process.env.SISEM_ENABLE_TEST_OTP);
const ACTIVE_AUTH_HARNESS_MODE: AuthHarnessMode =
  process.env.PLAYWRIGHT_AUTH_HARNESS_MODE === "backend-real"
    ? "backend-real"
    : "hybrid";

/**
 * ============================================================
 * SUITE E2E EXHAUSTIVA: AUTHENTICATION (SISEM)
 * ============================================================
 *
 * Coverage total de la feature Auth:
 * 1. Login/Logout (6 tests)
 * 2. Onboarding (3 tests)
 * 3. Password Reset (5 tests)
 * 4. Session Management (3 tests)
 * 5. API Contract Validation (4 tests)
 *
 * Total: 21 tests
 */

const TEST_USERS = getAuthE2ETestUsers(ACTIVE_AUTH_HARNESS_MODE);
const EMAILS = AUTH_TEST_EMAILS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getResetOtpCode = async (request: APIRequestContext, email: string) => {
  const response = await request.get(
    `${resolveApiBaseUrl(PLAYWRIGHT_APP_ORIGIN)}/auth/test-get-otp?email=${encodeURIComponent(email)}`,
  );

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(isRecord(body)).toBe(true);

  const otpCode =
    isRecord(body) && typeof body.code === "string" ? body.code : null;
  expect(otpCode).toBeTruthy();
  expect(otpCode).toHaveLength(6);

  return otpCode as string;
};
// ============================================================================
// TEST SUITE: LOGIN / LOGOUT
// ============================================================================
test.describe("Auth: Login / Logout", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetAuthE2EHarness(page, request);

    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test.afterEach(async ({ page, request }) => {
    await resetAuthE2EHarness(page, request);
  });

  test(
    "TC001: Login exitoso con credenciales válidas - Admin",
    {
      tag: [
        "@critical",
        "@e2e",
        "@auth",
        "@login",
        "@AUTH-E2E-001",
        "@kan-92-critical",
        "@KAN-92-TC001",
      ],
    },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login(TEST_USERS.admin);
      await authPage.expectSuccessfulLogin();

      // Verify redirect to appropriate dashboard
      await expect(page).toHaveURL(/\/(dashboard)?/);
    },
  );

  test(
    "TC002: Login exitoso con diferentes roles",
    { tag: ["@high", "@e2e", "@auth", "@login", "@AUTH-E2E-002"] },
    async ({ context }) => {
      test.setTimeout(120000);
      // Test cada rol en un contexto separado para aislar sesiones
      const roles = [
        { name: "clinico", credentials: TEST_USERS.clinico, route: "/clinico" },
        {
          name: "recepcion",
          credentials: TEST_USERS.recepcion,
          route: "/recepcion",
        },
        {
          name: "farmacia",
          credentials: TEST_USERS.farmacia,
          route: "/farmacia",
        },
        {
          name: "urgencias",
          credentials: TEST_USERS.urgencias,
          route: "/urgencias",
        },
      ];

      for (const { credentials, route } of roles) {
        // Crear nuevo contexto para cada rol (sesión limpia)
        const browser = context.browser();
        if (!browser) {
          throw new Error(
            "Playwright browser instance is required for role loop",
          );
        }

        const newContext = await browser.newContext();
        const newPage = await newContext.newPage();
        const authPage = new AuthPage(newPage);

        await authPage.gotoLogin();
        await authPage.login(credentials);

        // Verificar login exitoso por redirección usando waitForURL
        await newPage.waitForURL((url) => url.pathname.startsWith(route), {
          timeout: 15000,
          waitUntil: "networkidle",
        });

        // Cerrar contexto
        await newContext.close();
      }
    },
  );

  test(
    "TC003: Login fallido - Contraseña incorrecta",
    {
      tag: [
        "@critical",
        "@e2e",
        "@auth",
        "@login",
        "@AUTH-E2E-003",
        "@kan-92-critical",
        "@KAN-92-TC003",
      ],
    },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login({
        username: TEST_USERS.admin.username,
        password: "wrong",
      });

      await expect(page).toHaveURL(/.*login.*/);
    },
  );

  test(
    "TC004: Login fallido - Usuario inactivo",
    { tag: ["@critical", "@e2e", "@auth", "@login", "@AUTH-E2E-004"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login(TEST_USERS.inactivo);
      await expect(page).toHaveURL(/.*login.*/);
    },
  );

  test(
    "TC005: Login fallido - Usuario bloqueado",
    { tag: ["@critical", "@e2e", "@auth", "@login", "@AUTH-E2E-005"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login(TEST_USERS.bloqueado);
      await expect(page).toHaveURL(/.*login.*/);
    },
  );

  test(
    "TC006: Logout exitoso limpia sesión",
    {
      tag: [
        "@critical",
        "@e2e",
        "@auth",
        "@logout",
        "@AUTH-E2E-006",
        "@kan-92-critical",
        "@KAN-92-TC006",
      ],
    },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login first
      await authPage.gotoLogin();
      await authPage.login(TEST_USERS.admin);

      // Esperar redirección exitosa usando waitForURL
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 15000,
        waitUntil: "networkidle",
      });

      // Verificar que hay cookies de auth
      // Logout via API con CSRF
      const apiBaseUrl = resolveApiBaseUrl(new URL(page.url()).origin);
      const logoutStatus = await page.evaluate(async (baseUrl) => {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("csrf_token="))
          ?.split("=")[1];
        const response = await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
        });
        return response.status;
      }, apiBaseUrl);
      expect(logoutStatus).toBe(200);

      // Verificar redirección a login al acceder a ruta protegida
      await page.goto("/dashboard");
      await page.waitForURL("/login", {
        timeout: 15000,
        waitUntil: "networkidle",
      });

      await expect(page).toHaveURL("/login");
    },
  );
});

// ============================================================================
// TEST SUITE: ONBOARDING
// ============================================================================
test.describe.serial("Auth: Onboarding", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetAuthE2EHarness(page, request);
  });

  test.afterEach(async ({ page, request }) => {
    await resetAuthE2EHarness(page, request);
  });

  test(
    "TC007: Onboarding completo - Aceptar términos y cambiar contraseña",
    { tag: ["@critical", "@e2e", "@auth", "@onboarding", "@AUTH-E2E-007"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login with user requiring onboarding
      await authPage.gotoLogin();
      const loginResponse = await authPage.login(TEST_USERS.onboarding);
      expect(loginResponse.status()).toBe(200);

      // Esperar a que aparezca el contenido de onboarding
      await expect(page.getByText("Términos y Condiciones de Uso")).toBeVisible(
        { timeout: 20000 },
      );

      // Accept terms
      await authPage.acceptTerms();

      // Complete password change
      const newPassword = "Nueva_Clave_Segura_123!";
      await authPage.completePasswordChange(newPassword);

      // Verify success
      await authPage.expectOnboardingSuccess();
      await expect(page).toHaveURL("/dashboard");
    },
  );

  test(
    "TC008: Onboarding - Usuario que debe cambiar contraseña",
    { tag: ["@high", "@e2e", "@auth", "@onboarding", "@AUTH-E2E-008"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login with user requiring password change
      await authPage.gotoLogin();
      const loginResponse = await authPage.login(
        TEST_USERS.cambiarClaveClinico,
      );
      expect(loginResponse.status()).toBe(200);

      // Esperar a que aparezca el contenido de onboarding
      await expect(page.getByText("Términos y Condiciones de Uso")).toBeVisible(
        { timeout: 20000 },
      );

      // Accept terms
      await authPage.acceptTerms();

      // Complete with strong password
      const newPassword = "Nueva_Clave_Segura_123!";
      await authPage.newPasswordInput.fill(newPassword);
      await authPage.expectPasswordRequirements();
      await authPage.confirmPasswordInput.fill(newPassword);
      await authPage.finishButton.click();

      // Verify success
      await authPage.expectOnboardingSuccess();
    },
  );

  test(
    "TC009: Onboarding - Validación de contraseña en tiempo real",
    { tag: ["@medium", "@e2e", "@auth", "@onboarding", "@AUTH-E2E-009"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login and reach onboarding
      await authPage.gotoLogin();
      const loginResponse = await authPage.login(TEST_USERS.onboardingClinico);
      expect(loginResponse.status()).toBe(200);

      // Esperar a que aparezca el contenido de onboarding
      await expect(page.getByText("Términos y Condiciones de Uso")).toBeVisible(
        { timeout: 20000 },
      );

      // Accept terms
      await authPage.acceptTerms();

      // Enter weak password
      await authPage.newPasswordInput.fill("weak");

      // Requirements should show as not met
      await authPage.expectPasswordRequirements();

      // Try to submit - should show validation error
      await authPage.finishButton.click();

      // Should still be on page with password form
      await expect(page.getByText("Requisitos de Contraseña")).toBeVisible();
    },
  );
});

// ============================================================================
// TEST SUITE: PASSWORD RESET
// ============================================================================
test.describe.serial("Auth: Password Reset", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetAuthE2EHarness(page, request);

    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test.afterEach(async ({ page, request }) => {
    await resetAuthE2EHarness(page, request);
  });

  test(
    "TC010: Password reset - Solicitar código con email registrado",
    { tag: ["@critical", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-010"] },
    async ({ page, request }) => {
      test.skip(!ENABLE_TEST_OTP, "Requires SISEM_ENABLE_TEST_OTP");

      const authPage = new AuthPage(page);

      // Start password reset flow
      await authPage.startPasswordReset();

      const email = getResetEmail("TC010", test.info().project.name);

      // Request code
      const requestResponse = await authPage.requestResetCode(email, {
        retries: 2,
        retryDelayMs: 2000,
      });
      expect(requestResponse.status()).toBe(200);

      // Verify code sent confirmation
      await authPage.expectResetCodeSent();

      // Should show OTP verification screen
      await authPage.expectOtpVerificationScreen();

      // Obtener OTP del endpoint de test
      await getResetOtpCode(request, email);
    },
  );

  test(
    "TC011: Password reset - Email no registrado muestra error",
    { tag: ["@high", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-011"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.startPasswordReset();
      const requestResponse = await authPage.requestResetCode(EMAILS.unknown);
      expect(requestResponse.status()).toBe(404);

      // Should show error
      await authPage.expectLoginError("Usuario no encontrado");
    },
  );

  test(
    "TC012: Password reset - Código OTP incorrecto",
    { tag: ["@high", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-012"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Start reset flow
      await authPage.startPasswordReset();
      const email = getResetEmail("TC012", test.info().project.name);
      const requestResponse = await authPage.requestResetCode(email, {
        retries: 2,
        retryDelayMs: 2000,
      });
      expect(requestResponse.status()).toBe(200);
      await authPage.expectOtpVerificationScreen();

      // Enter wrong OTP
      await authPage.enterOtpCode("111111");

      // Should show error
      const toast = await authPage.waitForToast("error");
      await expect(toast).toContainText(/Código (incorrecto|expirado)/i);
    },
  );

  test(
    "TC013: Password reset - Validación de complejidad de contraseña",
    { tag: ["@medium", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-013"] },
    async ({ page, request }) => {
      test.skip(!ENABLE_TEST_OTP, "Requires SISEM_ENABLE_TEST_OTP");

      const authPage = new AuthPage(page);

      // Start reset flow
      await authPage.startPasswordReset();
      const email = getResetEmail("TC013", test.info().project.name);
      const requestResponse = await authPage.requestResetCode(email, {
        retries: 2,
        retryDelayMs: 2000,
      });
      expect(requestResponse.status()).toBe(200);
      await authPage.expectOtpVerificationScreen();

      // Obtener OTP válido del endpoint de test
      const otpCode = await getResetOtpCode(request, email);

      // Enter valid OTP
      await authPage.enterOtpCode(otpCode);
      await waitForPasswordResetForm(page);

      // Try weak password
      await authPage.completePasswordReset("weak123");

      // Should show password requirements error
      await authPage.expectPasswordRequirements();
    },
  );

  test(
    "TC014: Password reset - Contraseñas no coinciden",
    { tag: ["@medium", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-014"] },
    async ({ page, request }) => {
      test.skip(!ENABLE_TEST_OTP, "Requires SISEM_ENABLE_TEST_OTP");

      const authPage = new AuthPage(page);

      await authPage.startPasswordReset();
      const email = getResetEmail("TC014", test.info().project.name);
      const requestResponse = await authPage.requestResetCode(email, {
        retries: 2,
        retryDelayMs: 2000,
      });
      expect(requestResponse.status()).toBe(200);
      await authPage.expectOtpVerificationScreen();

      // Obtener OTP válido del endpoint de test
      const otpCode = await getResetOtpCode(request, email);

      // Enter valid OTP
      await authPage.enterOtpCode(otpCode);
      await waitForPasswordResetForm(page);

      // Try passwords that don't match
      await authPage.newPasswordInput.fill("Password_Valida_123!");
      await authPage.confirmPasswordInput.fill("Otra_Password_456!");
      await authPage.resetPasswordButton.click();

      // Should show error
      await expect(
        page.getByText("Las contraseñas no coinciden"),
      ).toBeVisible();
    },
  );
});

// ============================================================================
// TEST SUITE: SESSION MANAGEMENT
// ============================================================================
test.describe("Auth: Session Management", () => {
  test(
    "TC015: Sesión expirada detectada automáticamente",
    { tag: ["@critical", "@e2e", "@auth", "@session", "@AUTH-E2E-015"] },
    async ({ page, context }) => {
      const authPage = new AuthPage(page);

      // Login
      await authPage.gotoLogin();
      await authPage.login(TEST_USERS.admin);
      await authPage.expectSuccessfulLogin();

      // Open new tab and trigger session expiration
      const newPage = await context.newPage();
      await newPage.goto("/");

      // Trigger session expired event via localStorage (cross-tab communication)
      await newPage.evaluate(() => {
        const key = "sisem:session-expired";
        localStorage.setItem(key, Date.now().toString());
        localStorage.removeItem(key);
      });

      // Original page should be redirected to login
      await waitForSessionExpiredRedirect(page);
    },
  );

  test(
    "TC016: Token refresh exitoso",
    { tag: ["@high", "@e2e", "@auth", "@session", "@AUTH-E2E-016"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login via UI para establecer cookies
      await authPage.gotoLogin();
      await authPage.login(TEST_USERS.admin);
      await authPage.expectSuccessfulLogin();

      // Extraer cookies del contexto
      // Hacer refresh desde el browser con CSRF
      const apiBaseUrl = resolveApiBaseUrl(new URL(page.url()).origin);
      const refreshResult = await page.evaluate(async (baseUrl) => {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("csrf_token="))
          ?.split("=")[1];
        const response = await fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
        });
        return { status: response.status, ok: response.ok };
      }, apiBaseUrl);

      expect(refreshResult.status).toBe(200);
    },
  );

  test(
    "TC017: Acceso a ruta protegida sin autenticación redirige a login",
    {
      tag: [
        "@critical",
        "@e2e",
        "@auth",
        "@session",
        "@AUTH-E2E-017",
        "@kan-92-critical",
        "@KAN-92-TC017",
      ],
    },
    async ({ page, request }) => {
      await resetAuthE2EHarness(page, request);

      // Try to access protected route directly
      await page.goto("/dashboard");

      // Should be redirected to login
      await expect(page).toHaveURL("/login");
    },
  );
});

// ============================================================================
// TEST SUITE: API CONTRACT VALIDATION
// ============================================================================
test.describe("Auth: API Contract", () => {
  test(
    "TC018: API Login retorna estructura correcta",
    { tag: ["@critical", "@e2e", "@auth", "@api", "@AUTH-E2E-018"] },
    async ({ request }) => {
      const api = new AuthAPI(request);

      const response = await api.login(TEST_USERS.admin);
      expect(response.status).toBe(200);

      const body = response.body as LoginResponse;

      // Verify contract structure
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("requiresOnboarding");
      expect(body.user).toHaveProperty("username");
      expect(body.user).toHaveProperty("roles");
      expect(body.user).toHaveProperty("landingRoute");

      // Verify types
      expect(typeof body.requiresOnboarding).toBe("boolean");
      expect(Array.isArray(body.user.roles)).toBe(true);
    },
  );

  test(
    "TC019: API /me retorna información de usuario",
    { tag: ["@high", "@e2e", "@auth", "@api", "@AUTH-E2E-019"] },
    async ({ request }) => {
      const api = new AuthAPI(request);

      // Login first
      await api.login(TEST_USERS.admin);

      // Get me
      const response = await api.me();
      expect(response.status).toBe(200);

      const body = response.body as MeResponse;

      // Verify contract
      expect(body).toHaveProperty("username");
      expect(body).toHaveProperty("fullName");
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("roles");
      expect(body).toHaveProperty("permissions");
      expect(body).toHaveProperty("landingRoute");
    },
  );

  test(
    "TC020: API /verify valida sesión",
    { tag: ["@high", "@e2e", "@auth", "@api", "@AUTH-E2E-020"] },
    async ({ request }) => {
      const api = new AuthAPI(request);

      // Without auth should fail
      const unauthResponse = await api.verify();
      expect(unauthResponse.status).toBe(401);

      // Login
      await api.login(TEST_USERS.admin);

      // With auth should succeed
      const authResponse = await api.verify();
      expect(authResponse.status).toBe(200);
    },
  );

  test(
    "TC021: API Logout invalida sesión",
    {
      tag: [
        "@critical",
        "@e2e",
        "@auth",
        "@api",
        "@AUTH-E2E-021",
        "@kan-92-critical",
        "@KAN-92-TC021",
      ],
    },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login via UI para establecer cookies
      await authPage.gotoLogin();
      await authPage.login(TEST_USERS.admin);
      await authPage.expectSuccessfulLogin();

      // Hacer requests desde el browser para incluir cookies automáticamente
      const apiBaseUrl = resolveApiBaseUrl(new URL(page.url()).origin);
      const verifyBefore = await page.evaluate(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/auth/verify`, {
          credentials: "include",
        });
        return response.status;
      }, apiBaseUrl);
      expect(verifyBefore).toBe(200);

      // Logout desde el browser con CSRF
      const logoutResult = await page.evaluate(async (baseUrl) => {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("csrf_token="))
          ?.split("=")[1];
        const response = await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
        });
        return response.status;
      }, apiBaseUrl);
      expect(logoutResult).toBe(200);

      // Verify should fail now
      const verifyAfter = await page.evaluate(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/auth/verify`, {
          credentials: "include",
        });
        return response.status;
      }, apiBaseUrl);
      expect(verifyAfter).toBe(401);
    },
  );
});
