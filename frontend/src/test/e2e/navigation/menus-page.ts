import { expect, type Page } from "@playwright/test";

interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Page Object para `/admin/menus` (change `menu-modulos-crud-ui`, Fase 9):
 * la pantalla de gestion de menus (`MenusPage.tsx`) que permite crear,
 * editar, ocultar/restaurar y reordenar `Modulo` desde la UI real -- sin
 * pasar por Django admin ni por comandos de management, a diferencia de los
 * E2E mas viejos de `menu-modulos`/`menu-modulos-rol-ui`.
 *
 * Convenciones tomadas de `navigation-menu-page.ts` (mismo selector de
 * login) y `role-modules-page.ts` (mismo estilo de Page Object standalone,
 * getters para locators estables, metodos que encapsulan flujos de UI
 * completos).
 *
 * Los botones de accion de cada fila del arbol (`ModuleTreeRow.tsx`) tienen
 * `aria-label` que incluye el TITULO del modulo (ej. `Editar ${title}`,
 * `Subir ${title}`, `Ocultar ${title} del menú`) -- eso los hace
 * localizables de forma unica por titulo sin necesitar `data-testid` ni
 * navegar el DOM del contenedor de la fila.
 */
export class MenusPage {
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

  get heading() {
    return this.page.getByRole("heading", { name: "Gestión de menús" });
  }

  get searchInput() {
    return this.page.getByPlaceholder("Buscar módulo por título");
  }

  get newModuleButton() {
    return this.page.getByRole("button", { name: "Nuevo módulo" });
  }

  get wizardDialog() {
    return this.page.getByRole("dialog");
  }

  get destinationCombobox() {
    return this.wizardDialog.getByRole("combobox").first();
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

  async gotoMenus() {
    await this.page.goto("/admin/menus");
    await expect(this.heading).toBeVisible();
  }

  async searchModule(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Crea un acceso directo ("shortcut") de 3 pasos: Tipo+Título+Icono (paso
   * 1, se deja el icono sin elegir -- es opcional, `icon` es nullable en
   * `moduleBasicsSchema`) -> Destino (paso 2, `MenuDestinationSelect`
   * buscado por LABEL humano) -> Ubicación (paso 3, se deja "Raíz" por
   * default). El tipo "Acceso directo" ya es el default del wizard
   * (`DEFAULT_VALUES.kind = "shortcut"`), asi que no hace falta tocar el
   * radio del paso 1.
   */
  async createShortcut(options: { title: string; destinationLabel: string }) {
    await this.newModuleButton.click();
    await expect(
      this.wizardDialog.getByRole("heading", { name: "Nuevo módulo" }),
    ).toBeVisible();

    // Paso 1: título (tipo ya es "Acceso directo" por default, icono se deja sin elegir).
    await this.wizardDialog.getByLabel("Título").fill(options.title);
    await this.wizardDialog.getByRole("button", { name: "Siguiente" }).click();

    // Paso 2: destino, buscado por label humano (nunca por path/permiso crudo).
    await this.destinationCombobox.click();
    await this.page
      .getByPlaceholder("Buscar pantalla...")
      .fill(options.destinationLabel);
    // La opcion se localiza por el span EXACTO del label (`span.flex-1`,
    // clase unica de `MenuDestinationSelect`) en vez de por el nombre
    // accesible del boton completo: ese nombre concatena label+grupo (ej.
    // "Vacunas" + "Catálogos"), y ademas el filtro de busqueda hace match
    // por substring -- "Vacunas" matchea tanto la opcion "Vacunas" como
    // "Inventario de Vacunas". El `:text-is()` exige texto EXACTO del span,
    // sin ambiguedad.
    await this.page
      .locator(`button:has(span.flex-1:text-is("${options.destinationLabel}"))`)
      .click();
    await this.wizardDialog.getByRole("button", { name: "Siguiente" }).click();

    // Paso 3: ubicación -- se deja "Raíz (sin carpeta)", el default del Select.
    await this.wizardDialog.getByRole("button", { name: "Crear" }).click();
  }

  async expectToastContains(text: string) {
    const toast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: text })
      .first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  editButton(title: string) {
    return this.page.getByRole("button", { name: `Editar ${title}` });
  }

  moveUpButton(title: string) {
    return this.page.getByRole("button", { name: `Subir ${title}` });
  }

  moveDownButton(title: string) {
    return this.page.getByRole("button", { name: `Bajar ${title}` });
  }

  moveToFolderButton(title: string) {
    return this.page.getByRole("button", {
      name: `Mover ${title} a otra carpeta`,
    });
  }

  hideButton(title: string) {
    return this.page.getByRole("button", {
      name: `Ocultar ${title} del menú`,
    });
  }

  restoreButton(title: string) {
    return this.page.getByRole("button", {
      name: `Restaurar ${title} al menú`,
    });
  }

  async expectRowVisible(title: string) {
    await expect(this.editButton(title)).toBeVisible();
  }

  /**
   * Confirma el dialogo de "Ocultar módulo del menú" (`HideModuleDialog`).
   * Asume que el dialogo ya esta abierto (via `hideButton(title).click()`).
   */
  async confirmHide() {
    await this.page
      .getByRole("dialog", { name: "Ocultar módulo del menú" })
      .getByRole("button", { name: "Ocultar" })
      .click();
  }

  /**
   * Posicion vertical (Y) de la fila de un modulo en el arbol, identificada
   * por su boton "Editar" (unico por titulo). Se usa para comparar el orden
   * relativo de dos hermanos sin asumir de antemano cual quedo primero al
   * crearlos -- mas robusto que asumir un orden de insercion fijo.
   */
  async rowTop(title: string): Promise<number> {
    const box = await this.editButton(title).boundingBox();
    if (!box) {
      throw new Error(`No se pudo obtener la posición de la fila "${title}"`);
    }
    return box.y;
  }

  /** Devuelve `[primero, segundo]` segun la posicion vertical actual en el arbol. */
  async orderOf(titleA: string, titleB: string): Promise<[string, string]> {
    const [topA, topB] = await Promise.all([
      this.rowTop(titleA),
      this.rowTop(titleB),
    ]);
    return topA < topB ? [titleA, titleB] : [titleB, titleA];
  }
}
