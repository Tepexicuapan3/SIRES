import { expect, type Page } from "@playwright/test";

interface LoginCredentials {
  username: string;
  password: string;
}

export interface DiscapacidadListItemFixture {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface CatalogImportRowFixture {
  ID: number;
  Clave: string;
  Nombre: string;
  Activo: string;
  ERROR: string;
}

export interface CatalogImportResponseFixture {
  total_records: number;
  total_errores: number;
  inserted: number;
  rows: CatalogImportRowFixture[];
}

// Patrones de glob explicitos (mismo patron que `NAVIGATION_MENU_ROUTE_GLOB`
// en navigation-menu-page.ts): strings, no funciones, para que `page.route`
// y `page.unroute` comparen por igualdad y el mock se pueda limpiar.
// El sufijo `?*` en LIST lo separa de IMPORT_PREVIEW/IMPORT_CONFIRM: la
// lista siempre viaja con querystring (page/pageSize via
// `useDiscapacidadesList`), los endpoints de import nunca.
const DISABILITIES_LIST_ROUTE_GLOB = "**/api/v1/disabilities/?*";
const DISABILITIES_PREVIEW_ROUTE_GLOB =
  "**/api/v1/disabilities/import/preview/";
const DISABILITIES_CONFIRM_ROUTE_GLOB =
  "**/api/v1/disabilities/import/confirm/";

/**
 * Page Object para el flujo de import masivo por Excel en Discapacidades
 * (change `import-catalogos-excel`, Fase 8 / tarea 8.3).
 *
 * Convenciones tomadas de `rbac-page.ts` (login) y de
 * `navigation-menu-page.ts` (mock de red via `page.route` con globs string
 * reusables para poder `unroute` despues).
 *
 * Por que se mockean preview/confirm/list en vez de generar un .xlsx real:
 * este repo no tiene NINGUNA libreria de escritura de xlsx en el frontend
 * (ni en dependencies ni devDependencies) y no hay precedente de generar
 * fixtures binarias de Excel en ningun test existente (unit/integration/e2e)
 * -- ni siquiera para CIES, el precedente de import mas cercano, que no
 * tiene cobertura e2e. Inventar un escritor de xlsx desde cero (formato ZIP
 * + OOXML) para un solo spec es exactamente el tipo de infraestructura
 * nueva no verificable que este change pidio evitar. En cambio, se
 * intercepta la respuesta de red de preview/confirm/list -- el mismo patron
 * ya establecido por `NavigationMenuPage.mockMenuResponse` -- lo que
 * permite ejercitar el codigo REAL del frontend (incluida la logica de
 * reintento-en-409 de `catalog-import.api.ts::confirm()`, ver
 * `sdd/import-catalogos-excel/apply-progress`) sin depender del contenido
 * binario del archivo subido. El input de archivo igual recibe un File real
 * (bytes dummy) porque el <input type="file"> lo exige, pero esos bytes
 * nunca llegan a un backend real: la request queda interceptada antes.
 *
 * El login SI pega contra un backend real (no hay forma de mockear
 * `/auth/login` sin reimplementar el flujo de autenticacion completo, y
 * ningun spec existente en este repo lo hace) -- por eso este spec, como
 * el resto de `src/test/e2e/**`, requiere un backend vivo en
 * `PLAYWRIGHT_BASE_URL`/`localhost:5000` para poder correr.
 */
export class CatalogImportPage {
  private listItems: DiscapacidadListItemFixture[] = [];

  constructor(private readonly page: Page) {}

  async login(credentials: LoginCredentials): Promise<void> {
    await this.page.goto("/login");
    await expect(
      this.page.getByLabel("No. Expediente o Usuario"),
    ).toBeVisible();
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
   * Reemplaza el listado de Discapacidades servido por el backend via
   * interceptacion de red, para que el estado inicial (y el post-import)
   * sean deterministas sin depender de que datos ya existan en la BD del
   * entorno donde corra este spec. Llamar `setListItems` despues actualiza
   * lo que devuelve el MISMO route handler (util para simular que la fila
   * importada ya aparece tras el refetch).
   */
  async mockDisabilitiesList(
    items: DiscapacidadListItemFixture[],
  ): Promise<void> {
    this.listItems = items;
    await this.page.route(DISABILITIES_LIST_ROUTE_GLOB, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: this.listItems,
          page: 1,
          pageSize: 10,
          total: this.listItems.length,
          totalPages: 1,
        }),
      });
    });
  }

  setListItems(items: DiscapacidadListItemFixture[]): void {
    this.listItems = items;
  }

  async mockPreview(response: CatalogImportResponseFixture): Promise<void> {
    await this.page.unroute(DISABILITIES_PREVIEW_ROUTE_GLOB);
    await this.page.route(DISABILITIES_PREVIEW_ROUTE_GLOB, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Simula el 409 todo-o-nada tal como lo devuelve el backend real
   * (`code: "IMPORT_HAS_ERRORS"`). Ejercita el codigo REAL de
   * `catalog-import.api.ts::confirm()`: ante un 409 ese cliente vuelve a
   * llamar a `preview()` con el mismo archivo para reconstruir las filas
   * con error (el interceptor global de errores descarta el `details` del
   * 409, ver `apply-progress`) -- por eso `mockPreview` debe seguir activo
   * y devolviendo las filas con error cuando se llama a este metodo.
   */
  async mockConfirmRejected(): Promise<void> {
    await this.page.unroute(DISABILITIES_CONFIRM_ROUTE_GLOB);
    await this.page.route(DISABILITIES_CONFIRM_ROUTE_GLOB, async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          total_records: 0,
          total_errores: 0,
          inserted: 0,
          rows: [],
          code: "IMPORT_HAS_ERRORS",
        }),
      });
    });
  }

  async mockConfirmSucceeds(
    response: CatalogImportResponseFixture,
  ): Promise<void> {
    await this.page.unroute(DISABILITIES_CONFIRM_ROUTE_GLOB);
    await this.page.route(DISABILITIES_CONFIRM_ROUTE_GLOB, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });
  }

  async unrouteAll(): Promise<void> {
    await this.page.unroute(DISABILITIES_LIST_ROUTE_GLOB);
    await this.page.unroute(DISABILITIES_PREVIEW_ROUTE_GLOB);
    await this.page.unroute(DISABILITIES_CONFIRM_ROUTE_GLOB);
  }

  async gotoDiscapacidades(): Promise<void> {
    await this.page.goto("/admin/catalogos/discapacidades");
    await expect(
      this.page.getByRole("heading", { name: "Discapacidades" }),
    ).toBeVisible();
  }

  get dialog() {
    return this.page.getByRole("dialog", {
      name: /Importar Discapacidades desde Excel/,
    });
  }

  get confirmButton() {
    return this.dialog.getByRole("button", { name: "Confirmar importacion" });
  }

  async openImportDialog(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Opciones de tabla" })
      .click();
    await this.page.getByRole("menuitem", { name: "Importar Excel" }).click();
    await expect(this.dialog).toBeVisible();
  }

  /** Real: no se mockea, prueba el endpoint real de descarga de plantilla. */
  async downloadTemplate() {
    const downloadPromise = this.page.waitForEvent("download", {
      timeout: 15000,
    });
    await this.dialog
      .getByRole("button", { name: /Descargar plantilla/ })
      .click();
    return downloadPromise;
  }

  /**
   * Sube un archivo dummy: el <input type="file"> exige bytes reales, pero
   * la request de preview/confirm que dispara este archivo esta
   * interceptada por `mockPreview`/`mockConfirmSucceeds`/
   * `mockConfirmRejected`, asi que el contenido binario nunca se valida
   * contra un parser real.
   */
  async uploadFile(fileName = "discapacidades.xlsx"): Promise<void> {
    await this.dialog.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("e2e-fixture-bytes-intercepted-by-page-route"),
    });
  }

  async clickPreview(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: "Previsualizar informacion" })
      .click();
  }

  async clickConfirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async expectToastContains(text: string): Promise<void> {
    const toast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: text })
      .first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  }
}
