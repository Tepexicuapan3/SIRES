import { test, expect, type APIRequestContext } from "@playwright/test";
import { AuthPage, AuthAPI } from "./auth-page";

/**
 * ============================================================
 * SUITE E2E EXHAUSTIVA: AUTHENTICATION (SIRES)
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

// Test data - Based on seed_e2e.py
const TEST_USERS = {
  admin: { username: "admin", password: "Sires_123456" },
  clinico: { username: "clinico", password: "Sires_123456" },
  recepcion: { username: "recepcion", password: "Sires_123456" },
  farmacia: { username: "farmacia", password: "Sires_123456" },
  urgencias: { username: "urgencias", password: "Sires_123456" },
  inactivo: { username: "usuario_inactivo", password: "Sires_123456" },
  bloqueado: { username: "usuario_bloqueado", password: "Sires_123456" },
  onboarding: { username: "usuario_onboarding", password: "Sires_123456" },
  onboardingClinico: {
    username: "usuario_onboarding_clinico",
    password: "Sires_123456",
  },
  onboardingRecepcion: {
    username: "usuario_onboarding_recepcion",
    password: "Sires_123456",
  },
  cambiarClave: { username: "usuario_cambiar_clave", password: "Sires_123456" },
  cambiarClaveClinico: {
    username: "usuario_cambiar_clave_clinico",
    password: "Sires_123456",
  },
};

const EMAILS = {
  admin: "admin@sires.local",
  clinico: "clinico@sires.local",
  recepcion: "recepcion@sires.local",
  farmacia: "farmacia@sires.local",
  urgencias: "urgencias@sires.local",
  unknown: "noexiste@sires.local",
};

const RESET_EMAIL_MATRIX = {
  TC010: {
    chromium: EMAILS.admin,
    firefox: EMAILS.clinico,
    webkit: EMAILS.recepcion,
    chrome: EMAILS.farmacia,
    zen: EMAILS.urgencias,
  },
  TC012: {
    chromium: EMAILS.clinico,
    firefox: EMAILS.recepcion,
    webkit: EMAILS.farmacia,
    chrome: EMAILS.urgencias,
    zen: EMAILS.admin,
  },
  TC013: {
    chromium: EMAILS.recepcion,
    firefox: EMAILS.farmacia,
    webkit: EMAILS.urgencias,
    chrome: EMAILS.admin,
    zen: EMAILS.clinico,
  },
  TC014: {
    chromium: EMAILS.farmacia,
    firefox: EMAILS.urgencias,
    webkit: EMAILS.admin,
    chrome: EMAILS.clinico,
    zen: EMAILS.recepcion,
  },
} as const;

type ResetTestId = keyof typeof RESET_EMAIL_MATRIX;

const getResetEmail = (testId: ResetTestId, projectName: string) => {
  const mapping = RESET_EMAIL_MATRIX[testId];
  return (mapping as Record<string, string>)[projectName] ?? EMAILS.admin;
};

const resetTestUser = async (
  request: APIRequestContext,
  payload: {
    username: string;
    requiresOnboarding?: boolean;
    mustChangePassword?: boolean;
  },
) => {
  const response = await request.post(
    "http://localhost:5000/api/v1/auth/test-reset-user",
    { data: payload },
  );

  expect(response.status()).toBe(200);
};

// ============================================================================
// TEST SUITE: LOGIN / LOGOUT
// ============================================================================
test.describe("Auth: Login / Logout", () => {
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test(
    "TC001: Login exitoso con credenciales válidas - Admin",
    { tag: ["@critical", "@e2e", "@auth", "@login", "@AUTH-E2E-001"] },
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
        const newContext = await context.browser().newContext();
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
    { tag: ["@critical", "@e2e", "@auth", "@login", "@AUTH-E2E-003"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login({
        username: TEST_USERS.admin.username,
        password: "WrongPassword123!",
      });

      await authPage.expectLoginError("Usuario o contraseña incorrectos");
      await expect(page).toHaveURL(/.*login.*/);
    },
  );

  test(
    "TC004: Login fallido - Usuario inactivo",
    { tag: ["@critical", "@e2e", "@auth", "@login", "@AUTH-E2E-004"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login(TEST_USERS.inactivo);
      await authPage.expectLoginError(
        "Cuenta desactivada por un administrador",
      );
    },
  );

  test(
    "TC005: Login fallido - Usuario bloqueado",
    { tag: ["@critical", "@e2e", "@auth", "@login", "@AUTH-E2E-005"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login(TEST_USERS.bloqueado);
      await authPage.expectLoginError("Cuenta bloqueada por intentos fallidos");
    },
  );

  test(
    "TC006: Logout exitoso limpia sesión",
    { tag: ["@critical", "@e2e", "@auth", "@logout", "@AUTH-E2E-006"] },
    async ({ page, context }) => {
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
      const cookiesBefore = await context.cookies();
      const hasAuthCookie = cookiesBefore.some(
        (c) => c.name === "access_token_cookie",
      );
      expect(hasAuthCookie).toBe(true);

      // Logout via API con CSRF
      const logoutStatus = await page.evaluate(async () => {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("csrf_token="))
          ?.split("=")[1];
        const response = await fetch(
          "http://localhost:5000/api/v1/auth/logout",
          {
            method: "POST",
            credentials: "include",
            headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
          },
        );
        return response.status;
      });
      expect(logoutStatus).toBe(200);

      // Verificar redirección a login al acceder a ruta protegida
      await page.goto("/dashboard");
      await page.waitForURL("/login", {
        timeout: 15000,
        waitUntil: "networkidle",
      });

      // Verify cookies cleared after logout
      const cookiesAfter = await context.cookies();
      const authCookies = cookiesAfter.filter((c) =>
        ["access_token_cookie", "refresh_token_cookie"].includes(c.name),
      );
      expect(authCookies).toHaveLength(0);
    },
  );
});

// ============================================================================
// TEST SUITE: ONBOARDING
// ============================================================================
test.describe.serial("Auth: Onboarding", () => {
  test(
    "TC007: Onboarding completo - Aceptar términos y cambiar contraseña",
    { tag: ["@critical", "@e2e", "@auth", "@onboarding", "@AUTH-E2E-007"] },
    async ({ page, request }) => {
      const authPage = new AuthPage(page);

      await resetTestUser(request, {
        username: TEST_USERS.onboarding.username,
        requiresOnboarding: true,
        mustChangePassword: false,
      });

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
    async ({ page, request }) => {
      const authPage = new AuthPage(page);

      await resetTestUser(request, {
        username: TEST_USERS.cambiarClaveClinico.username,
        requiresOnboarding: true,
        mustChangePassword: true,
      });

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
    async ({ page, request }) => {
      const authPage = new AuthPage(page);

      await resetTestUser(request, {
        username: TEST_USERS.onboardingClinico.username,
        requiresOnboarding: true,
        mustChangePassword: false,
      });

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
  test.beforeEach(async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
  });

  test(
    "TC010: Password reset - Solicitar código con email registrado",
    { tag: ["@critical", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-010"] },
    async ({ page }) => {
      test.skip(
        !process.env.SIRES_ENABLE_TEST_OTP,
        "Requires SIRES_ENABLE_TEST_OTP",
      );

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
      const otpData = await page.evaluate(async (email) => {
        const response = await fetch(
          `http://localhost:5000/api/v1/auth/test-get-otp?email=${email}`,
        );
        return response.json();
      }, email);

      expect(otpData.code).toBeDefined();
      expect(otpData.code).toHaveLength(6);
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
      await authPage.enterOtpCode("000000");

      // Should show error
      const toast = await authPage.waitForToast("error");
      await expect(toast).toContainText("Código incorrecto");
    },
  );

  test(
    "TC013: Password reset - Validación de complejidad de contraseña",
    { tag: ["@medium", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-013"] },
    async ({ page }) => {
      test.skip(
        !process.env.SIRES_ENABLE_TEST_OTP,
        "Requires SIRES_ENABLE_TEST_OTP",
      );

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
      const otpData = await page.evaluate(async (email) => {
        const response = await fetch(
          `http://localhost:5000/api/v1/auth/test-get-otp?email=${email}`,
        );
        return response.json();
      }, email);

      // Enter valid OTP
      await authPage.enterOtpCode(otpData.code);
      await page.waitForTimeout(1000); // Wait for transition

      // Try weak password
      await authPage.completePasswordReset("weak123");

      // Should show password requirements error
      await authPage.expectPasswordRequirements();
    },
  );

  test(
    "TC014: Password reset - Contraseñas no coinciden",
    { tag: ["@medium", "@e2e", "@auth", "@password-reset", "@AUTH-E2E-014"] },
    async ({ page }) => {
      test.skip(
        !process.env.SIRES_ENABLE_TEST_OTP,
        "Requires SIRES_ENABLE_TEST_OTP",
      );

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
      const otpData = await page.evaluate(async (email) => {
        const response = await fetch(
          `http://localhost:5000/api/v1/auth/test-get-otp?email=${email}`,
        );
        return response.json();
      }, email);

      // Enter valid OTP
      await authPage.enterOtpCode(otpData.code);
      await page.waitForTimeout(1000); // Wait for transition

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
      await newPage.goto("http://localhost:5173");

      // Trigger session expired event via localStorage (cross-tab communication)
      await newPage.evaluate(() => {
        const key = "sires:session-expired";
        localStorage.setItem(key, Date.now().toString());
        localStorage.removeItem(key);
      });

      // Wait a bit for event propagation
      await page.waitForTimeout(2000);

      // Original page should be redirected to login
      await expect(page).toHaveURL("/login");
    },
  );

  test(
    "TC016: Token refresh exitoso",
    { tag: ["@high", "@e2e", "@auth", "@session", "@AUTH-E2E-016"] },
    async ({ page, context }) => {
      const authPage = new AuthPage(page);

      // Login via UI para establecer cookies
      await authPage.gotoLogin();
      await authPage.login(TEST_USERS.admin);
      await authPage.expectSuccessfulLogin();

      // Extraer cookies del contexto
      const cookies = await context.cookies();
      const hasRefreshToken = cookies.some(
        (c) => c.name === "refresh_token_cookie",
      );
      expect(hasRefreshToken).toBe(true);

      // Hacer refresh desde el browser con CSRF
      const refreshResult = await page.evaluate(async () => {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("csrf_token="))
          ?.split("=")[1];
        const response = await fetch(
          "http://localhost:5000/api/v1/auth/refresh",
          {
            method: "POST",
            credentials: "include",
            headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
          },
        );
        return { status: response.status, ok: response.ok };
      });

      expect(refreshResult.status).toBe(200);
    },
  );

  test(
    "TC017: Acceso a ruta protegida sin autenticación redirige a login",
    { tag: ["@critical", "@e2e", "@auth", "@session", "@AUTH-E2E-017"] },
    async ({ page }) => {
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
      expect(response.status()).toBe(200);

      const body = await response.json();

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
      expect(response.status()).toBe(200);

      const body = await response.json();

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
      expect(unauthResponse.status()).toBe(401);

      // Login
      await api.login(TEST_USERS.admin);

      // With auth should succeed
      const authResponse = await api.verify();
      expect(authResponse.status()).toBe(200);
    },
  );

  test(
    "TC021: API Logout invalida sesión",
    { tag: ["@critical", "@e2e", "@auth", "@api", "@AUTH-E2E-021"] },
    async ({ page }) => {
      const authPage = new AuthPage(page);

      // Login via UI para establecer cookies
      await authPage.gotoLogin();
      await authPage.login(TEST_USERS.admin);
      await authPage.expectSuccessfulLogin();

      // Hacer requests desde el browser para incluir cookies automáticamente
      const verifyBefore = await page.evaluate(async () => {
        const response = await fetch(
          "http://localhost:5000/api/v1/auth/verify",
          {
            credentials: "include",
          },
        );
        return response.status;
      });
      expect(verifyBefore).toBe(200);

      // Logout desde el browser con CSRF
      const logoutResult = await page.evaluate(async () => {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("csrf_token="))
          ?.split("=")[1];
        const response = await fetch(
          "http://localhost:5000/api/v1/auth/logout",
          {
            method: "POST",
            credentials: "include",
            headers: csrfToken ? { "X-CSRF-TOKEN": csrfToken } : undefined,
          },
        );
        return response.status;
      });
      expect(logoutResult).toBe(200);

      // Verify should fail now
      const verifyAfter = await page.evaluate(async () => {
        const response = await fetch(
          "http://localhost:5000/api/v1/auth/verify",
          {
            credentials: "include",
          },
        );
        return response.status;
      });
      expect(verifyAfter).toBe(401);
    },
  );
});
