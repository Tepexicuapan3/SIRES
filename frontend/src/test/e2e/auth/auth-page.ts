import {
  Page,
  Locator,
  expect,
  APIRequestContext,
  type APIResponse,
} from "@playwright/test";

/**
 * BasePage - Clase base para todas las páginas
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async waitForToast(type?: "success" | "error" | "info"): Promise<Locator> {
    let selector = "[data-sonner-toast]";
    if (type) {
      selector += `[data-type="${type}"]`;
    }
    return this.page.locator(selector).first();
  }

  async getToastMessage(): Promise<string> {
    const toast = await this.waitForToast();
    await expect(toast).toBeVisible({ timeout: 5000 });
    return toast.textContent() || "";
  }

  async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }
}

/**
 * Datos para login
 */
export interface LoginData {
  username: string;
  password: string;
}

/**
 * Datos para password reset
 */
export interface PasswordResetData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

interface RequestResetOptions {
  retries?: number;
  retryDelayMs?: number;
}

/**
 * AuthPage - Page Object para toda la funcionalidad de Auth
 */
export class AuthPage extends BasePage {
  // Login elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordButton: Locator;

  // Onboarding elements
  readonly termsAcceptCheckbox: Locator;
  readonly continueButton: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly finishButton: Locator;

  // Password Reset elements
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly otpInputs: Locator[];
  readonly resetPasswordButton: Locator;

  // General
  readonly backButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    // Login
    this.usernameInput = page.getByLabel("No. Expediente o Usuario");
    this.passwordInput = page.locator('input#password[type="password"]');
    this.loginButton = page.getByRole("button", { name: "Iniciar Sesión" });
    this.rememberMeCheckbox = page.getByRole("checkbox", {
      name: "Recordar mi usuario en este dispositivo",
    });
    this.forgotPasswordButton = page.getByRole("button", {
      name: "¿Olvidaste tu contraseña?",
    });

    // Onboarding - usar id o aria-label específico
    this.termsAcceptCheckbox = page.locator("#accept-terms");
    this.continueButton = page.getByRole("button", { name: "Continuar" });
    this.newPasswordInput = page.getByLabel("Nueva Contraseña");
    this.confirmPasswordInput = page.getByLabel("Confirmar Contraseña");
    this.finishButton = page.getByRole("button", {
      name: "Finalizar y Acceder",
    });

    // Password Reset
    this.emailInput = page.getByLabel("Correo Electrónico");
    this.sendCodeButton = page.getByRole("button", { name: "Enviar Código" });
    this.otpInputs = Array.from({ length: 6 }, (_, i) =>
      page.getByLabel(`Dígito ${i + 1} de 6`),
    );
    this.resetPasswordButton = page.getByRole("button", {
      name: "Restablecer Contraseña",
    });

    // General
    this.backButton = page.getByRole("button", { name: "Volver" });
    this.logoutButton = page.getByRole("button", {
      name: /Cerrar Sesión|Salir/,
    });
  }

  async gotoLogin(): Promise<void> {
    await this.goto("/login");
  }

  /**
   * LOGIN ACTIONS
   */
  async login(data: LoginData): Promise<APIResponse> {
    await expect(this.usernameInput).toBeVisible({ timeout: 10000 });
    await expect(this.usernameInput).toBeEditable({ timeout: 10000 });
    await this.usernameInput.fill(data.username);
    await this.passwordInput.fill(data.password);
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/auth/login") &&
          response.request().method() === "POST",
      ),
      this.loginButton.click(),
    ]);
    return response;
  }

  async loginWithRememberMe(data: LoginData): Promise<void> {
    await this.usernameInput.fill(data.username);
    await this.passwordInput.fill(data.password);
    await this.rememberMeCheckbox.check();
    await this.loginButton.click();
  }

  async expectLoginError(message: string): Promise<void> {
    const toast = await this.waitForToast("error");
    await expect(toast).toContainText(message);
  }

  async expectSuccessMessage(message: string): Promise<void> {
    const toast = await this.waitForToast("success");
    await expect(toast).toContainText(message);
  }

  async expectSuccessfulLogin(timeout = 15000): Promise<void> {
    // Should redirect away from login - usar waitForURL para polling
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout,
      waitUntil: "networkidle",
    });
  }

  async expectOnboardingRedirect(timeout = 15000): Promise<void> {
    // Esperar redirección específica a onboarding
    await this.page.waitForURL("/onboarding", {
      timeout,
      waitUntil: "networkidle",
    });
  }

  /**
   * ONBOARDING ACTIONS
   */
  async acceptTerms(): Promise<void> {
    await this.termsAcceptCheckbox.check();
    await this.continueButton.click();
  }

  async completePasswordChange(
    newPassword: string,
    confirmPassword?: string,
  ): Promise<void> {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword || newPassword);
    await this.finishButton.click();
  }

  async expectOnboardingSuccess(): Promise<void> {
    await this.expectSuccessMessage("Cuenta activada");
  }

  /**
   * PASSWORD RESET ACTIONS
   */
  async startPasswordReset(): Promise<void> {
    await expect(this.forgotPasswordButton).toBeVisible({ timeout: 10000 });
    await this.forgotPasswordButton.click();
  }

  async requestResetCode(
    email: string,
    options: RequestResetOptions = {},
  ): Promise<APIResponse> {
    const retries = options.retries ?? 0;
    const retryDelayMs = options.retryDelayMs ?? 1000;

    await this.emailInput.fill(email);

    let lastResponse: APIResponse | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const [response] = await Promise.all([
        this.page.waitForResponse(
          (res) =>
            res.url().includes("/auth/request-reset-code") &&
            res.request().method() === "POST",
        ),
        this.sendCodeButton.click(),
      ]);

      lastResponse = response;
      if (response.status() !== 429) {
        return response;
      }

      if (attempt < retries) {
        await this.page.waitForTimeout(retryDelayMs);
      }
    }

    return lastResponse as APIResponse;
  }

  async enterOtpCode(code: string): Promise<void> {
    for (let i = 0; i < 6; i++) {
      await this.otpInputs[i].fill(code[i] || "");
    }
  }

  async completePasswordReset(
    newPassword: string,
    confirmPassword?: string,
  ): Promise<void> {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword || newPassword);
    await this.resetPasswordButton.click();
  }

  async expectResetCodeSent(): Promise<void> {
    await this.expectSuccessMessage("Código enviado");
  }

  async expectOtpVerificationScreen(): Promise<void> {
    await expect(this.page.getByLabel("Dígito 1 de 6")).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * SESSION MANAGEMENT
   */
  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.page).toHaveURL("/login");
  }

  /**
   * VALIDATION HELPERS
   */
  async expectPasswordRequirements(): Promise<void> {
    await expect(this.page.getByText("Requisitos de Contraseña")).toBeVisible();
  }

  async getPasswordRequirementStatus(): Promise<{
    length: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  }> {
    const results = {
      length: false,
      uppercase: false,
      number: false,
      special: false,
    };

    const requirements = this.page.locator("li").filter({
      has: this.page.locator("text=Mínimo 8 caracteres"),
    });
    const lengthCheck = requirements.locator("svg").first();
    results.length = await lengthCheck.evaluate(
      (el) => el.getAttribute("data-state") === "checked",
    );

    return results;
  }
}

/**
 * API Helper para tests con CSRF support
 *
 * Nota: Este helper requiere usar BrowserContext en lugar de APIRequestContext
 * directo para poder manejar cookies correctamente.
 */
export class AuthAPI {
  private csrfToken: string = "";
  private cookies: string = "";

  constructor(
    private request: APIRequestContext,
    private context?: any, // BrowserContext opcional para extraer cookies
  ) {}

  private async extractCsrfFromCookies() {
    if (this.context) {
      const cookies = await this.context.cookies();
      const csrfCookie = cookies.find((c: any) => c.name === "csrf_token");
      if (csrfCookie) {
        this.csrfToken = csrfCookie.value;
      }

      // Build cookie string for requests
      this.cookies = cookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
    }
  }

  private getHeaders(includeCsrf = false) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.cookies) {
      headers["Cookie"] = this.cookies;
    }

    if (includeCsrf && this.csrfToken) {
      headers["X-CSRF-TOKEN"] = this.csrfToken;
    }

    return headers;
  }

  async login(credentials: LoginData) {
    const response = await this.request.post(
      "http://localhost:5000/api/v1/auth/login",
      {
        data: credentials,
        headers: this.getHeaders(),
      },
    );

    // Extraer cookies después del login
    await this.extractCsrfFromCookies();

    return response;
  }

  async logout() {
    return this.request.post("http://localhost:5000/api/v1/auth/logout", {
      headers: this.getHeaders(true),
    });
  }

  async me() {
    return this.request.get("http://localhost:5000/api/v1/auth/me", {
      headers: this.getHeaders(),
    });
  }

  async verify() {
    return this.request.get("http://localhost:5000/api/v1/auth/verify", {
      headers: this.getHeaders(),
    });
  }

  async refresh() {
    return this.request.post("http://localhost:5000/api/v1/auth/refresh", {
      headers: this.getHeaders(true),
    });
  }

  async requestResetCode(email: string) {
    return this.request.post(
      "http://localhost:5000/api/v1/auth/request-reset-code",
      {
        data: { email },
        headers: this.getHeaders(),
      },
    );
  }

  async verifyResetCode(email: string, code: string) {
    return this.request.post(
      "http://localhost:5000/api/v1/auth/verify-reset-code",
      {
        data: { email, code },
        headers: this.getHeaders(),
      },
    );
  }

  async resetPassword(newPassword: string) {
    return this.request.post(
      "http://localhost:5000/api/v1/auth/reset-password",
      {
        data: { newPassword },
        headers: this.getHeaders(true),
      },
    );
  }

  async completeOnboarding(newPassword: string, termsAccepted: boolean) {
    return this.request.post(
      "http://localhost:5000/api/v1/auth/complete-onboarding",
      {
        data: { newPassword, termsAccepted },
        headers: this.getHeaders(true),
      },
    );
  }
}
