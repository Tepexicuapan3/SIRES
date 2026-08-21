import { expect, test } from "@playwright/test";
import { MenusPage } from "./menus-page";
import { NavigationMenuPage } from "./navigation-menu-page";

/**
 * E2E: menu-modulos-crud-ui (change `menu-modulos-crud-ui`, Fase 9 / tareas
 * 9.1-9.3). Cubre `sdd/menu-modulos-crud-ui/tasks`:
 *   - 9.1: crear un acceso directo nuevo aparece en el árbol de gestión Y
 *     en el sidebar real, sin build/deploy.
 *   - 9.2: ocultar/mover una sección `es_sistema=True` está bloqueado en
 *     la UI.
 *   - 9.3: reordenar con los botones Subir/Bajar persiste tras refrescar.
 *
 * A diferencia de `navigation-menu.e2e.ts` (change `menu-modulos`, sin
 * endpoint de escritura -- solo Django admin) este change SÍ agrega un CRUD
 * REST completo (`POST/PATCH /modules`, `.../visibility`, `.../reorder`) y
 * una pantalla real (`/admin/menus`, `MenusPage.tsx`) -- por eso este spec
 * usa esa UI de punta a punta, sin depender de Django admin ni de env vars
 * de credenciales de superusuario.
 *
 * ══════════════════════════════════════════════════════════════════════
 * LIMITACIONES DOCUMENTADAS (leer antes de correr o extender este spec)
 * ══════════════════════════════════════════════════════════════════════
 *
 * 1. Todo el spec corre como `admin` (wildcard `*`, ver Fase 3.3 de
 *    `sdd/menu-modulos-crud-ui/apply-progress`: el seed real NO tiene
 *    ninguna asignación explícita de `admin:gestion:modulos:*` a un rol
 *    no-admin, y la Fase 3 documentó explícitamente que no encontró un
 *    candidato natural en la BD real para probar con permisos parciales).
 *    No se inventa un rol nuevo para este spec -- si en el futuro se
 *    siembra un rol con `admin:gestion:modulos:read` (solo lectura, sin
 *    `:create`/`:update`/`:delete`), vale la pena sumar un caso que
 *    confirme que los botones de mutación no aparecen para ese rol (hoy
 *    `MenusPage` ya lo resuelve del lado cliente via `hasCapability`, ver
 *    `canCreateModule`/`canUpdateModule`/`canDeleteModule`, pero no hay
 *    forma de ejercitarlo end-to-end sin ese rol sembrado).
 *
 * 2. No existe ningún botón de "Eliminar" real en toda la pantalla
 *    (`HideModuleDialog`: "NUNCA hay un boton de Eliminar real... ocultar
 *    es reversible"). Por eso el "revertir" de los módulos de prueba
 *    creados por 9.1 y 9.3 significa OCULTARLOS (soft delete,
 *    `isActive: false`), no borrarlos -- es el único mecanismo que ofrece
 *    el producto. Corridas repetidas de este spec van a ir acumulando
 *    módulos de prueba ocultos (no visibles en ningún sidebar real, pero
 *    sí en el catálogo con `includeInactive=1`) -- limitación aceptada del
 *    diseño, no un descuido de limpieza de este test.
 *
 * 3. La tarea 9.3 pide reordenar "con los botones Subir/Bajar (o teclado
 *    si los botones son accesibles por teclado)". Los botones de
 *    `ModuleTreeRow` son `<Button>` reales (foco + Enter/Space nativos del
 *    navegador), así que SÍ son accesibles por teclado -- pero Playwright
 *    no gana nada operándolos por teclado en vez de `.click()` (ambos
 *    disparan el mismo `onClick`), así que este spec usa `.click()` como
 *    el resto de los E2E del repo, sin duplicar cobertura.
 *
 * 4. El test de reordenamiento (9.3) asume que dos módulos creados en
 *    sucesión en la raíz quedan ADYACENTES en el orden (el backend agrega
 *    hermanos nuevos al final del grupo, `ReorderModuleUseCase`/
 *    `create_module.py` renumeran 10,20,30...). Por eso el test NO asume
 *    de antemano cuál de los dos quedó primero -- lee la posición vertical
 *    real de ambas filas (`MenusPage.orderOf`) antes de mover nada.
 */

const TEST_PASSWORD = "Sisem_123456";
const DESTINATION_LABEL = "Vacunas";

test.describe("Gestión de menús: CRUD real vía /admin/menus (tarea 9.1)", () => {
  test(
    "crear un acceso directo lo hace aparecer en el árbol de gestión y en el sidebar tras refrescar",
    { tag: ["@e2e", "@navigation", "@menus-crud"] },
    async ({ page }) => {
      const menusPage = new MenusPage(page);
      const navPage = new NavigationMenuPage(page);
      const title = `E2E Menu ${Date.now()}`;

      await menusPage.login({ username: "admin", password: TEST_PASSWORD });
      await menusPage.gotoMenus();

      try {
        await menusPage.createShortcut({
          title,
          destinationLabel: DESTINATION_LABEL,
        });
        await menusPage.expectToastContains("Módulo creado");
        await menusPage.expectRowVisible(title);

        // Refrescar: confirma que quedó persistido en BD (no solo en el
        // estado optimista del cliente) y que el sidebar real -- chrome
        // global de la misma página, no una pantalla aparte -- lo muestra.
        await page.reload({ waitUntil: "networkidle" });
        await menusPage.expectRowVisible(title);

        const links = await navPage.getSidebarLinks();
        expect(
          links.some(
            (link) =>
              link.title === title && link.href === "/admin/catalogos/vacunas",
          ),
          `El sidebar debería mostrar "${title}" apuntando a /admin/catalogos/vacunas tras refrescar, sin build/deploy.`,
        ).toBe(true);
      } finally {
        // Revertir: ocultar el módulo de prueba (ver limitación #2 -- no
        // existe un "Eliminar" real). `hideButton` puede no existir si el
        // `createShortcut` falló antes de completarse -- en ese caso no
        // hay nada que revertir.
        if (await menusPage.hideButton(title).isVisible({ timeout: 1000 }).catch(() => false)) {
          await menusPage.hideButton(title).click();
          await menusPage.confirmHide();
          await menusPage.expectToastContains("Módulo oculto");
        }
      }
    },
  );
});

test.describe("Gestión de menús: protección de secciones de sistema (tarea 9.2)", () => {
  test(
    "ocultar o mover un módulo es_sistema=True está bloqueado en la UI",
    { tag: ["@e2e", "@navigation", "@menus-crud", "@system-protection"] },
    async ({ page }) => {
      const menusPage = new MenusPage(page);
      // "Usuarios" (administracion.panel.usuarios) quedó marcado
      // `es_sistema=True` en la migración 0005 de este change (ver Fase 1
      // de `sdd/menu-modulos-crud-ui/tasks`) y ya se usa como título real
      // anclado en código en `role-modules-sidebar.e2e.ts`.
      const systemTitle = "Usuarios";

      await menusPage.login({ username: "admin", password: TEST_PASSWORD });
      await menusPage.gotoMenus();
      await menusPage.searchModule(systemTitle);
      await menusPage.expectRowVisible(systemTitle);

      // No se intenta clickear -- Playwright ya falla la actionability
      // check sobre un botón disabled, así que la aserción "está
      // bloqueado" es directamente sobre el estado disabled + el tooltip
      // explicativo (primera rama de la tarea 9.2: "botón deshabilitado
      // con tooltip explicativo").
      const hideBtn = menusPage.hideButton(systemTitle);
      await expect(hideBtn).toBeDisabled();
      await hideBtn.hover();
      await expect(page.getByRole("tooltip").first()).toContainText(
        "Módulo de sistema",
      );

      const moveBtn = menusPage.moveToFolderButton(systemTitle);
      await expect(moveBtn).toBeDisabled();
      await moveBtn.hover();
      await expect(page.getByRole("tooltip").first()).toContainText(
        "Módulo de sistema",
      );

      // Nada que revertir -- este caso no muta datos (los botones nunca
      // llegaron a ser clickeados).
    },
  );
});

test.describe("Gestión de menús: reordenamiento con Subir/Bajar (tarea 9.3)", () => {
  test(
    "reordenar dos módulos no-sistema con Subir/Bajar persiste tras refrescar",
    { tag: ["@e2e", "@navigation", "@menus-crud", "@reorder"] },
    async ({ page }) => {
      const menusPage = new MenusPage(page);
      const suffix = Date.now();
      const titleA = `E2E Reorder A ${suffix}`;
      const titleB = `E2E Reorder B ${suffix}`;

      await menusPage.login({ username: "admin", password: TEST_PASSWORD });
      await menusPage.gotoMenus();

      try {
        await menusPage.createShortcut({
          title: titleA,
          destinationLabel: DESTINATION_LABEL,
        });
        await menusPage.expectToastContains("Módulo creado");

        await menusPage.createShortcut({
          title: titleB,
          destinationLabel: DESTINATION_LABEL,
        });
        await menusPage.expectToastContains("Módulo creado");

        // No se asume de antemano cuál quedó primero -- se lee la
        // posición vertical real (ver limitación #4 en el encabezado).
        const [first, second] = await menusPage.orderOf(titleA, titleB);

        // Subir al segundo lo intercambia con el que está inmediatamente
        // arriba -- si son adyacentes (esperado, ver limitación #4), pasa
        // a ser el primero.
        await menusPage.moveUpButton(second).click();

        await expect
          .poll(async () => menusPage.orderOf(titleA, titleB))
          .toEqual([second, first]);

        // Refrescar: confirma que el nuevo orden quedó persistido en BD
        // (renumeración real vía `PATCH /modules/reorder`), no solo en el
        // estado optimista/cache del cliente.
        await page.reload({ waitUntil: "networkidle" });
        await menusPage.expectRowVisible(titleA);
        await menusPage.expectRowVisible(titleB);

        expect(await menusPage.orderOf(titleA, titleB)).toEqual([
          second,
          first,
        ]);
      } finally {
        // Revertir: ocultar ambos módulos de prueba (ver limitación #2).
        for (const title of [titleA, titleB]) {
          const hideBtn = menusPage.hideButton(title);
          if (await hideBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await hideBtn.click();
            await menusPage.confirmHide();
            await menusPage.expectToastContains("Módulo oculto");
          }
        }
      }
    },
  );
});
