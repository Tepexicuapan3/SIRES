import { expect, type Locator, type Page } from "@playwright/test";

interface LoginCredentials {
  username: string;
  password: string;
}

export class RbacPage {
  constructor(private readonly page: Page) {}

  get loginUsernameInput() {
    return this.page.getByLabel("No. Expediente o Usuario");
  }

  get loginPasswordInput() {
    return this.page.locator("input#password");
  }

  get loginButton() {
    return this.page.getByRole("button", { name: "Iniciar Sesión" });
  }

  async gotoLogin() {
    await this.page.goto("/login");
    await expect(this.loginUsernameInput).toBeVisible();
  }

  async login(credentials: LoginCredentials) {
    await this.gotoLogin();
    await this.loginUsernameInput.fill(credentials.username);
    await this.loginPasswordInput.fill(credentials.password);
    await this.loginButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20000,
      waitUntil: "networkidle",
    });
  }

  async expandAdminPanel() {
    const panelButton = this.page.getByRole("button", { name: "Panel" });
    await expect(panelButton).toBeVisible();
    const isExpanded =
      (await panelButton.getAttribute("aria-expanded")) === "true";

    if (!isExpanded) {
      await panelButton.click();
    }
  }

  async navigateToRoles() {
    await this.expandAdminPanel();
    await this.page.getByRole("link", { name: /^Roles/ }).click();
    await expect(
      this.page.getByRole("heading", { name: "Roles" }),
    ).toBeVisible();
  }

  async navigateToUsers() {
    await this.expandAdminPanel();
    await this.page
      .getByRole("link", { name: /^Usuarios y Perfiles de Acceso/ })
      .click();
    await expect(
      this.page.getByRole("heading", { name: "Usuarios" }),
    ).toBeVisible();
  }

  async openRoleDetails(roleName: string) {
    const row = this.page
      .getByRole("row", { name: new RegExp(roleName, "i") })
      .first();
    await expect(row).toBeVisible();
    await row.click();

    const dialog = this.page.getByRole("dialog", { name: "Detalle de rol" });
    if (!(await dialog.isVisible({ timeout: 1500 }))) {
      await row.getByRole("button", { name: "Acciones" }).click();
      await this.page.getByRole("menuitem", { name: "Ver detalles" }).click();
    }

    await expect(dialog).toBeVisible();
  }

  async openFirstUserDetails() {
    const row = this.page.locator("tbody tr").first();
    await expect(row).toBeVisible();
    await row.click();

    const dialog = this.page.getByRole("dialog", {
      name: "Detalle de usuario",
    });
    if (!(await dialog.isVisible({ timeout: 1500 }))) {
      await row.getByRole("button", { name: "Acciones" }).click();
      await this.page.getByRole("menuitem", { name: "Ver detalles" }).click();
    }

    await expect(dialog).toBeVisible();
  }

  async openRoleCreateDialog() {
    await this.page.getByRole("button", { name: "Nuevo" }).click();
    await expect(
      this.page.getByRole("dialog", { name: "Nuevo rol" }),
    ).toBeVisible();
  }

  async openUserCreateDialog() {
    await this.page.getByRole("button", { name: "Nuevo" }).click();
    await expect(
      this.page.getByRole("dialog", { name: "Nuevo usuario" }),
    ).toBeVisible();
  }

  async expectToastContains(text: string) {
    const toast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: text })
      .first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  async chooseOptionFromCombobox(combobox: Locator, optionText: string) {
    await combobox.click();

    const listboxId = await combobox.getAttribute("aria-controls");

    if (listboxId) {
      const listbox = this.page.locator(`#${listboxId}`);
      await expect(listbox).toBeVisible();
      await listbox
        .getByRole("option", { name: optionText })
        .first()
        .click({ force: true });
      return;
    }

    await this.page
      .getByRole("option", { name: optionText })
      .first()
      .click({ force: true });
  }
}
