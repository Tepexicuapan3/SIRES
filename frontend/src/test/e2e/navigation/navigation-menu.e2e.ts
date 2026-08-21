import { expect, test } from "@playwright/test";
import { NavigationMenuPage } from "./navigation-menu-page";

/**
 * E2E: menu-modulos (change `menu-modulos`, Fase 5 / tarea 5.5).
 *
 * Cubre: `docs`/spec `sdd/menu-modulos/spec` — "Fallback ante fallo/timeout
 * del endpoint", "Paridad con flag OFF" — y tasks `sdd/menu-modulos/tasks`
 * 5.5 ("Test E2E Playwright: sidebar idéntico ON vs OFF; alta en admin
 * aparece sin redeploy").
 *
 * ══════════════════════════════════════════════════════════════════════
 * LIMITACIONES DOCUMENTADAS (leer antes de correr o extender este spec)
 * ══════════════════════════════════════════════════════════════════════
 *
 * 1. NO hay forma de controlar el feature flag backend
 *    (`NAVIGATION_MENU_SOURCE` / `NAVIGATION_MENU_DB_ENABLED`) desde un
 *    test Playwright. Se leen una sola vez al arrancar el proceso Django
 *    (`config/settings.py`, vía `python-decouple` sobre `.env`/env vars de
 *    contenedor) — no son endpoints, no son cookies, no son headers. Para
 *    cambiarlos hay que reiniciar el proceso backend con otra variable de
 *    entorno. Por eso:
 *      - El bloque "Paridad ON vs OFF" (abajo) NO fuerza el flag: hace
 *        login real, lee el `source` que el backend YA está devolviendo, y
 *        si no es `"db"` hace `test.skip(...)` con el motivo explícito en
 *        vez de fingir un resultado. Para ejecutarlo de verdad hay que
 *        levantar el backend con `NAVIGATION_MENU_SOURCE=db` (o
 *        `NAVIGATION_MENU_DB_ENABLED=true`) ANTES de correr Playwright.
 *      - El bloque "Fallback" SÍ es 100% ejecutable en cualquier entorno,
 *        porque no depende del flag real: usa `page.route()` para
 *        interceptar la respuesta del navegador y simular `source:
 *        "static"` o una falla 500 — eso es control del lado cliente, no
 *        del proceso Django.
 *
 * 2. NO existe ningún endpoint REST para crear/editar `Modulo` — el único
 *    endpoint de la Fase 3 es `GET /api/v1/navigation-menu` (solo lectura).
 *    El único mecanismo de alta hoy es (a) `manage.py seed_navigation_menu`
 *    (comando CLI, no accesible desde un test de navegador) o (b) el
 *    Django admin (`ModuloAdmin`, ya registrado en
 *    `backend/apps/administracion/admin.py`) con una cuenta de staff. Este
 *    repo NO versiona credenciales de superusuario de Django para
 *    `/django-admin/` (se buscó `DJANGO_SUPERUSER_*`/`createsuperuser`/
 *    fixtures y no hay nada). El test "alta sin redeploy" de abajo queda
 *    implementado contra `/django-admin/administracion/modulo/add/` pero
 *    gateado con `test.skip()` hasta que se provean
 *    `PLAYWRIGHT_DJANGO_ADMIN_USERNAME` / `PLAYWRIGHT_DJANGO_ADMIN_PASSWORD`
 *    (más `PLAYWRIGHT_NAV_TEST_PERMISSION_ID`, el PK numérico de un
 *    permiso real que el usuario de prueba ya tenga — el campo
 *    `id_permiso` del inline es `raw_id_fields`, así que no hay selector
 *    con nombre para resolverlo sin ese ID).
 *
 * 3. El prompt de esta tarea menciona un usuario "con el override mínimo
 *    que ya conocemos de `tepexicuapandavid3@gmail.com`". Se buscó ese
 *    string en todo el repo y en la memoria persistente (Engram,
 *    `sdd/menu-modulos/*`) y NO aparece en ningún lado — no hay username,
 *    password ni set de permisos versionado para esa cuenta. En vez de
 *    inventar credenciales, el rol "usuario mínimo/override" del bloque de
 *    paridad se parametriza por env vars
 *    (`PLAYWRIGHT_NAV_MINIMAL_USER`/`PLAYWRIGHT_NAV_MINIMAL_PASSWORD`) y se
 *    saltea con motivo explícito si no están seteadas.
 *
 * 4. Para el rol "permisos parciales" SÍ se reusa una cuenta que otro spec
 *    de este mismo repo ya prueba como real (`rbac.e2e.ts`):
 *    `admin_usuarios_readonly`, con permiso confirmado
 *    `admin:gestion:usuarios:read` (ver RBAC-E2E-004). Ese permiso mapea al
 *    ítem "Usuarios" en `nav-config.ts` / el seed de `cat_modulos`, así que
 *    es un candidato verificable — a diferencia del punto 3, esta cuenta
 *    SÍ está anclada en código existente del proyecto.
 *
 * 5. Riesgo NO resuelto por este spec (dejar anotado para Fase 5.4/5.6):
 *    Fase 2 (`sdd/menu-modulos/apply-progress`) reportó 31 de 56 códigos de
 *    permiso del seed sin match en `cat_permisos` de la BD de dev. Si el
 *    bloque de paridad corre contra ese entorno con un rol no-admin, es
 *    esperable que FALLE legítimamente (el árbol `db` tendrá menos nodos
 *    gateados-por-permiso que el árbol `static`/`NAV_CONFIG` para esos 31
 *    códigos huérfanos) — no es un bug del test, es el catálogo de
 *    permisos incompleto que ya estaba documentado.
 */

const TEST_PASSWORD = "Sisem_123456";

test.describe("Fallback del sidebar cuando el flag backend está OFF o el endpoint falla", () => {
  test(
    "sidebar no queda vacío cuando /navigation-menu responde source=static",
    { tag: ["@e2e", "@navigation", "@fallback"] },
    async ({ page }) => {
      const navPage = new NavigationMenuPage(page);

      // Registrar el mock ANTES de loguear, para que ya esté activo cuando
      // useNavigationMenu dispare el primer fetch tras la autenticación.
      await navPage.mockMenuResponse({
        source: "static",
        sections: [],
        secondaryItems: [],
      });

      await navPage.login({ username: "admin", password: TEST_PASSWORD });
      await navPage.expectSidebarNotEmpty();

      const links = await navPage.getSidebarLinks();
      expect(links.length).toBeGreaterThan(0);

      // "Panel" es un grupo de nivel 0 estable de NAV_CONFIG
      // (frontend/src/app/navigation/nav-config.ts) — confirma que lo que
      // se está viendo es el fallback local, no un árbol vacío disfrazado.
      await expect(
        navPage.sidebarNav.getByRole("button", { name: "Panel" }),
      ).toBeVisible();

      await navPage.clearMenuMock();
    },
  );

  test(
    "sidebar no queda vacío cuando /navigation-menu responde 500",
    { tag: ["@e2e", "@navigation", "@fallback"] },
    async ({ page }) => {
      const navPage = new NavigationMenuPage(page);

      await navPage.mockMenuResponse(null);
      await navPage.login({ username: "admin", password: TEST_PASSWORD });
      await navPage.expectSidebarNotEmpty();

      const links = await navPage.getSidebarLinks();
      expect(links.length).toBeGreaterThan(0);

      await navPage.clearMenuMock();
    },
  );
});

test.describe("Paridad ON vs OFF del árbol de navegación", () => {
  test.describe.configure({ mode: "serial" });

  interface RoleCase {
    label: string;
    resolveCredentials: () =>
      | { username: string; password: string }
      | { skipReason: string };
  }

  const ROLE_CASES: RoleCase[] = [
    {
      label: "admin (wildcard *)",
      resolveCredentials: () => ({ username: "admin", password: TEST_PASSWORD }),
    },
    {
      label: "admin_usuarios_readonly (permisos parciales, ver limitación #4)",
      resolveCredentials: () => ({
        username: "admin_usuarios_readonly",
        password: TEST_PASSWORD,
      }),
    },
    {
      label: "usuario mínimo/override (credenciales no versionadas, ver limitación #3)",
      resolveCredentials: () => {
        const username = process.env.PLAYWRIGHT_NAV_MINIMAL_USER;
        const password = process.env.PLAYWRIGHT_NAV_MINIMAL_PASSWORD;
        if (!username || !password) {
          return {
            skipReason:
              "PLAYWRIGHT_NAV_MINIMAL_USER/PLAYWRIGHT_NAV_MINIMAL_PASSWORD no están seteadas. " +
              "No hay credenciales versionadas en el repo para el usuario mínimo/override " +
              "mencionado en la tarea (tepexicuapandavid3@gmail.com) — ver limitación #3 en el encabezado del spec.",
          };
        }
        return { username, password };
      },
    },
  ];

  for (const roleCase of ROLE_CASES) {
    test(
      `sidebar idéntico en modo db y modo fallback para: ${roleCase.label}`,
      { tag: ["@e2e", "@navigation", "@parity"] },
      async ({ page }) => {
        const credentials = roleCase.resolveCredentials();

        if ("skipReason" in credentials) {
          test.skip(true, credentials.skipReason);
          return;
        }

        const navPage = new NavigationMenuPage(page);

        const realPayload =
          await navPage.loginAndCaptureMenuResponse(credentials);

        test.skip(
          realPayload.source !== "db",
          `El backend respondió source="${realPayload.source}" (no "db"). ` +
            "Este entorno no tiene el flag de navegación activo en BD y no hay forma de " +
            "togglearlo desde el test (ver limitación #1 en el encabezado del spec). " +
            "Levantar el backend con NAVIGATION_MENU_SOURCE=db para correr esta prueba.",
        );

        const dbLinks = await navPage.getSidebarLinks();
        expect(
          dbLinks.length,
          "El árbol en modo db no debería estar vacío para un usuario autenticado",
        ).toBeGreaterThan(0);

        // Misma sesión/usuario: forzar el fallback (cliente) y comparar.
        await navPage.mockMenuResponse({
          source: "static",
          sections: [],
          secondaryItems: [],
        });
        await page.reload({ waitUntil: "networkidle" });

        const fallbackLinks = await navPage.getSidebarLinks();

        expect(
          fallbackLinks,
          "El árbol servido por cat_modulos (source=db) debe ser idéntico " +
            "al fallback NAV_CONFIG filtrado para el mismo usuario. Si esto " +
            "falla, revisar códigos de permiso huérfanos en cat_permisos " +
            "(ver limitación #5) o desincronización del seed.",
        ).toEqual(dbLinks);

        await navPage.clearMenuMock();
      },
    );
  }
});

test.describe("Alta de módulo sin redeploy", () => {
  test(
    "un módulo dado de alta en Modulo aparece en el sidebar sin build/deploy",
    { tag: ["@e2e", "@navigation", "@alta-sin-redeploy"] },
    async ({ page }) => {
      const djangoAdminUsername = process.env.PLAYWRIGHT_DJANGO_ADMIN_USERNAME;
      const djangoAdminPassword = process.env.PLAYWRIGHT_DJANGO_ADMIN_PASSWORD;
      const permissionId = process.env.PLAYWRIGHT_NAV_TEST_PERMISSION_ID;

      test.skip(
        !djangoAdminUsername || !djangoAdminPassword || !permissionId,
        "PLAYWRIGHT_DJANGO_ADMIN_USERNAME / PLAYWRIGHT_DJANGO_ADMIN_PASSWORD / " +
          "PLAYWRIGHT_NAV_TEST_PERMISSION_ID no están seteadas. No hay credenciales de " +
          "superusuario de Django versionadas en este repo ni un endpoint REST para " +
          "crear Modulo — ver limitación #2 en el encabezado del spec. Este test queda " +
          "listo para correr contra /django-admin/ en cuanto exista esa infraestructura.",
      );

      const uniqueSuffix = Date.now();
      const clave = `e2e_alta_${uniqueSuffix}`;
      const titulo = `E2E Alta ${uniqueSuffix}`;
      const url = `/e2e-alta-${uniqueSuffix}`;

      // 1) Alta del módulo vía Django admin (ModuloAdmin ya registrado en
      //    backend/apps/administracion/admin.py). Nace como ítem raíz de
      //    grupo "secondary" (mismo patrón que el fixture "Soporte" en
      //    backend/apps/administracion/tests/test_navigation_menu.py) para
      //    no depender de resolver un id_parent por autocomplete.
      await page.goto("/django-admin/login/");
      await page.locator("#id_username").fill(djangoAdminUsername!);
      await page.locator("#id_password").fill(djangoAdminPassword!);
      await page.locator("#login-form").getByRole("button", { name: /Log in|Iniciar/i }).click();

      await page.goto("/django-admin/administracion/modulo/add/");
      await page.locator("#id_clave").fill(clave);
      await page.locator("#id_titulo").fill(titulo);
      await page.locator("#id_url").fill(url);
      await page.locator("#id_grupo").selectOption("secondary");

      // Inline ModuloPermisoInline (raw_id_fields=("id_permiso",)): sin
      // selector accesible por nombre, se llena el PK numérico directo.
      await page
        .locator("#id_modulopermiso_set-0-id_permiso")
        .fill(permissionId!);

      await page.getByRole("button", { name: /Save|Guardar/i }).first().click();
      await expect(page.getByText(/added successfully|añadido correctamente/i)).toBeVisible({
        timeout: 15000,
      });

      // 2) Verificar en el frontend, SIN ningún build/deploy — solo por
      //    estar en BD. Nueva sesión de navegador para no arrastrar la
      //    cookie de sesión de Django admin.
      await page.context().clearCookies();
      const navPage = new NavigationMenuPage(page);
      await navPage.login({
        username: "admin_usuarios_readonly",
        password: TEST_PASSWORD,
      });

      await page.reload({ waitUntil: "networkidle" });

      const links = await navPage.getSidebarLinks();
      expect(links.some((link) => link.title === titulo)).toBe(true);

      // También debe aparecer en el buscador de módulos (misma fuente).
      await navPage.searchModule(titulo);
      await expect(navPage.getSearchResultOption(titulo)).toBeVisible();
    },
  );
});

test.describe("Sincronía entre sidebar, breadcrumbs y buscador de módulos", () => {
  test(
    "el breadcrumb activo coincide con el título del link del sidebar",
    { tag: ["@e2e", "@navigation", "@sync"] },
    async ({ page }) => {
      const navPage = new NavigationMenuPage(page);
      await navPage.login({ username: "admin", password: TEST_PASSWORD });

      const links = await navPage.getSidebarLinks();
      const target = links.find(
        (link) => link.href && link.href !== "/" && link.href !== "#",
      );
      expect(target, "El sidebar debe tener al menos un link navegable").toBeTruthy();

      await page.goto(target!.href);
      await expect(navPage.breadcrumbNav).toContainText(target!.title);
    },
  );

  test(
    "el buscador de módulos devuelve el mismo módulo visible en el sidebar",
    { tag: ["@e2e", "@navigation", "@sync"] },
    async ({ page }) => {
      const navPage = new NavigationMenuPage(page);
      await navPage.login({ username: "admin", password: TEST_PASSWORD });

      const links = await navPage.getSidebarLinks();
      const target = links.find(
        (link) => link.href && link.href !== "/" && link.href !== "#",
      );
      expect(target, "El sidebar debe tener al menos un link navegable").toBeTruthy();

      await navPage.searchModule(target!.title);
      await expect(navPage.getSearchResultOption(target!.title)).toBeVisible();
    },
  );
});
