import { expect, type Page } from "@playwright/test";

interface LoginCredentials {
  username: string;
  password: string;
}

export interface NavigationMenuApiPayload {
  source: "db" | "static";
  sections: unknown[];
  secondaryItems: unknown[];
}

export interface SidebarLink {
  title: string;
  href: string;
}

const SIDEBAR_NAV_LABEL = "Menú de navegación principal";
const NAVIGATION_MENU_ROUTE_GLOB = "**/api/v1/navigation-menu";
const EXPAND_ALL_MAX_PASSES = 60;

/**
 * Page Object para los tests E2E de `menu-modulos` (sidebar / breadcrumbs /
 * buscador respaldados por `GET /api/v1/navigation-menu`).
 *
 * Convenciones tomadas de `rbac-page.ts` (mismo selector de login,
 * `TEST_PASSWORD` compartido) y `auth-harness.ts` (mismo patrón de
 * `waitForResponse`/mocking vía `page.route`).
 */
export class NavigationMenuPage {
  constructor(private readonly page: Page) {}

  get sidebarNav() {
    return this.page.getByRole("navigation", { name: SIDEBAR_NAV_LABEL });
  }

  get breadcrumbNav() {
    // Hay DOS <nav aria-label="breadcrumb"> en el DOM (versión mobile y
    // desktop de SidebarBreadcrumbs) — una siempre está oculta vía CSS
    // según el viewport. `:visible` filtra a la que realmente se ve.
    return this.page.locator("nav[aria-label='breadcrumb']:visible");
  }

  get moduleSearchInput() {
    return this.page.getByLabel("Buscar módulo").first();
  }

  async gotoLogin() {
    await this.page.goto("/login");
    await expect(
      this.page.getByLabel("No. Expediente o Usuario"),
    ).toBeVisible();
  }

  async login(credentials: LoginCredentials) {
    await this.gotoLogin();
    await this.page
      .getByLabel("No. Expediente o Usuario")
      .fill(credentials.username);
    await this.page.locator("input#password").fill(credentials.password);
    await this.page.getByRole("button", { name: "Iniciar Sesión" }).click();
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20000,
      waitUntil: "networkidle",
    });
  }

  /**
   * Login + captura la primera respuesta REAL (no mockeada) de
   * `/api/v1/navigation-menu` disparada por `useNavigationMenu` al
   * autenticarse. Usar para saber si el backend actual está sirviendo
   * `source: "db"` o `source: "static"` — no hay otra forma de consultar
   * el flag desde el navegador (ver limitación en el spec).
   */
  async loginAndCaptureMenuResponse(
    credentials: LoginCredentials,
  ): Promise<NavigationMenuApiPayload> {
    await this.gotoLogin();
    await this.page
      .getByLabel("No. Expediente o Usuario")
      .fill(credentials.username);
    await this.page.locator("input#password").fill(credentials.password);

    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/navigation-menu") &&
        response.request().method() === "GET",
      { timeout: 20000 },
    );

    await this.page.getByRole("button", { name: "Iniciar Sesión" }).click();
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20000,
      waitUntil: "networkidle",
    });

    const response = await responsePromise;
    return (await response.json()) as NavigationMenuApiPayload;
  }

  /**
   * Fuerza la respuesta de `/api/v1/navigation-menu` vía interceptación de
   * red (`page.route`). Simula flag backend en `static` (payload) o falla
   * del endpoint (`payload: null` => 500). Esto SÍ es controlable desde un
   * test Playwright porque intercepta en el cliente — no requiere tocar el
   * proceso Django real ni su variable de entorno.
   *
   * Debe llamarse ANTES de `login`/`gotoLogin` para que la ruta ya esté
   * registrada cuando `useNavigationMenu` dispare el fetch inicial.
   */
  async mockMenuResponse(
    payload: NavigationMenuApiPayload | null,
  ): Promise<void> {
    await this.page.route(NAVIGATION_MENU_ROUTE_GLOB, async (route) => {
      if (payload === null) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "forced failure (E2E mock)" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });
  }

  async clearMenuMock(): Promise<void> {
    await this.page.unroute(NAVIGATION_MENU_ROUTE_GLOB);
  }

  /**
   * Expande todos los grupos colapsables del sidebar (clic en cada trigger
   * con `aria-expanded="false"`) para poder leer también los hijos
   * anidados. Vuelve a consultar el DOM en cada pasada porque expandir un
   * grupo puede revelar nuevos triggers colapsados.
   */
  async expandAllGroups(): Promise<void> {
    for (let pass = 0; pass < EXPAND_ALL_MAX_PASSES; pass += 1) {
      const trigger = this.sidebarNav
        .locator('button[aria-expanded="false"]')
        .first();

      if ((await trigger.count()) === 0) {
        return;
      }

      await trigger.click();
      // Pequeño margen para que el Collapsible/Zustand store persista el
      // estado abierto antes de la siguiente pasada.
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Devuelve los links de hoja (con `href`) visibles en el sidebar, ya
   * expandido, ordenados por `href` para comparaciones estables entre
   * corridas (paridad ON/OFF).
   */
  async getSidebarLinks(): Promise<SidebarLink[]> {
    await this.expandAllGroups();

    const links = this.sidebarNav.getByRole("link");
    const count = await links.count();
    const items: SidebarLink[] = [];

    for (let i = 0; i < count; i += 1) {
      const link = links.nth(i);
      const href = (await link.getAttribute("href")) ?? "";
      const title = (await link.textContent())?.trim() ?? "";
      items.push({ title, href });
    }

    return items.sort((a, b) => a.href.localeCompare(b.href));
  }

  async expectSidebarNotEmpty(): Promise<void> {
    await expect(this.sidebarNav).toBeVisible();
    await expect(this.page.getByText("No hay menús disponibles")).toHaveCount(
      0,
    );
  }

  async searchModule(term: string) {
    await this.moduleSearchInput.click();
    await this.moduleSearchInput.fill(term);
  }

  getSearchResultOption(titleOrPattern: string | RegExp) {
    return this.page.getByRole("option", { name: titleOrPattern });
  }
}
