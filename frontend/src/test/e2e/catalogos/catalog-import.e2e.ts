import { expect, test } from "@playwright/test";
import { CatalogImportPage } from "./catalog-import-page";

/**
 * E2E: import-catalogos-excel (change `import-catalogos-excel`, Fase 8 /
 * tarea 8.3).
 *
 * Cubre `sdd/import-catalogos-excel/design` -> Testing Strategy -> E2E:
 * "flujo completo en Discapacidades: descargar plantilla -> subir con
 * error -> ver error -> subir correcto -> confirmar -> la fila aparece en
 * el listado".
 *
 * ══════════════════════════════════════════════════════════════════════
 * LIMITACIONES DOCUMENTADAS (leer antes de correr o extender este spec)
 * ══════════════════════════════════════════════════════════════════════
 *
 * 1. Requiere un backend real y vivo (login pega contra `/auth/login` de
 *    verdad, igual que el resto de `src/test/e2e/**` -- ver
 *    `rbac.e2e.ts`/`navigation-menu.e2e.ts`). NO se puede ejecutar en un
 *    sandbox sin Docker/backend levantado; este spec fue escrito y
 *    typechequeado (`pnpm run typecheck:e2e`) pero NO corrido en el
 *    entorno donde se implemento esta fase.
 *
 * 2. El listado de Discapacidades, y las respuestas de preview/confirm, SI
 *    estan mockeadas via `page.route` (mismo patron que
 *    `NavigationMenuPage.mockMenuResponse`). Motivo: este repo no tiene
 *    ninguna libreria para escribir archivos .xlsx en el frontend (ni en
 *    `package.json` ni como precedente en ningun test existente -- ni
 *    siquiera CIES, la unica feature de import previa, tiene cobertura
 *    e2e), asi que no hay forma de generar/editar un .xlsx real con
 *    filas validas/invalidas a medida sin inventar un escritor de ZIP/OOXML
 *    desde cero para un solo spec. Mockear la red permite ejercitar el
 *    codigo REAL del frontend (incluida la logica de reintento-en-409 de
 *    `catalog-import.api.ts::confirm()`) sin ese binario. El archivo que se
 *    sube al `<input type="file">` es un dummy: la request que dispara
 *    nunca llega a un parser real porque queda interceptada.
 *
 * 3. Asume que el usuario `admin` (credenciales compartidas del resto de
 *    los specs de este repo) tiene `admin:catalogos:discapacidades:create`
 *    -- es el usuario wildcard `*` que ya usan `navigation-menu.e2e.ts` y
 *    `rbac.e2e.ts` para casos "admin".
 */

const TEST_PASSWORD = "Sisem_123456";

test.describe("Import masivo de Excel en Discapacidades", () => {
  test(
    "descarga la plantilla, bloquea el todo-o-nada con filas de error, y confirma tras corregir el archivo",
    { tag: ["@e2e", "@catalogos", "@import", "@KAN-import-catalogos-excel"] },
    async ({ page }) => {
      const importPage = new CatalogImportPage(page);

      // Estado inicial deterministico del listado, independiente de lo que
      // ya exista en la BD del entorno donde corra este spec.
      const initialItems = [
        { id: 1, name: "Visual", code: "D01", isActive: true },
        { id: 2, name: "Auditiva", code: "D02", isActive: true },
      ];

      await importPage.mockDisabilitiesList(initialItems);
      await importPage.login({ username: "admin", password: TEST_PASSWORD });
      await importPage.gotoDiscapacidades();

      await expect(page.getByText("Visual")).toBeVisible();
      await expect(page.getByText("Auditiva")).toBeVisible();

      await importPage.openImportDialog();

      // 1) Descargar plantilla -- endpoint real, no mockeado.
      const download = await importPage.downloadTemplate();
      expect(download.suggestedFilename()).toBe(
        "plantilla_discapacidades.xlsx",
      );

      // 2) Subir un archivo "con error": preview mockeado con 1 fila
      //    invalida de 2.
      await importPage.mockPreview({
        total_records: 2,
        total_errores: 1,
        inserted: 0,
        rows: [
          { ID: 3, Clave: "D03", Nombre: "Motriz", Activo: "Si", ERROR: "" },
          {
            ID: 3,
            Clave: "D04",
            Nombre: "Intelectual",
            Activo: "Si",
            ERROR: "ID duplicado en el archivo. ",
          },
        ],
      });
      await importPage.uploadFile("discapacidades_con_error.xlsx");
      await importPage.clickPreview();

      // 3) Ver el error: alerta critica + Confirmar deshabilitado.
      await expect(
        importPage.dialog.getByText("La importacion tiene filas con error"),
      ).toBeVisible();
      await expect(
        importPage.dialog.getByText("ID duplicado en el archivo."),
      ).toBeVisible();
      await expect(importPage.confirmButton).toBeDisabled();

      // 4) Subir el archivo "correcto": preview mockeado sin errores.
      await importPage.mockPreview({
        total_records: 2,
        total_errores: 0,
        inserted: 0,
        rows: [
          { ID: 3, Clave: "D03", Nombre: "Motriz", Activo: "Si", ERROR: "" },
          {
            ID: 4,
            Clave: "D04",
            Nombre: "Intelectual",
            Activo: "Si",
            ERROR: "",
          },
        ],
      });
      await importPage.uploadFile("discapacidades_corregido.xlsx");
      await importPage.clickPreview();

      await expect(
        importPage.dialog.getByText("Vista previa lista"),
      ).toBeVisible();
      await expect(importPage.confirmButton).toBeEnabled();

      // 5) Confirmar: el backend inserta las 2 filas nuevas; el refetch del
      //    listado (disparado por `onImported`) debe mostrarlas.
      importPage.setListItems([
        ...initialItems,
        { id: 3, name: "Motriz", code: "D03", isActive: true },
        { id: 4, name: "Intelectual", code: "D04", isActive: true },
      ]);
      await importPage.mockConfirmSucceeds({
        total_records: 2,
        total_errores: 0,
        inserted: 2,
        rows: [],
      });
      await importPage.clickConfirm();

      await importPage.expectToastContains("Importacion completada");
      await expect(importPage.dialog).toBeHidden();

      // 6) La fila importada aparece en el listado.
      await expect(page.getByText("Motriz")).toBeVisible();
      await expect(page.getByText("Intelectual")).toBeVisible();

      await importPage.unrouteAll();
    },
  );

  test(
    "el todo-o-nada real (409 del backend) deja el dialogo abierto y no llama a onImported",
    {
      tag: [
        "@e2e",
        "@catalogos",
        "@import",
        "@KAN-import-catalogos-excel-409",
      ],
    },
    async ({ page }) => {
      const importPage = new CatalogImportPage(page);

      await importPage.mockDisabilitiesList([
        { id: 1, name: "Visual", code: "D01", isActive: true },
      ]);
      await importPage.login({ username: "admin", password: TEST_PASSWORD });
      await importPage.gotoDiscapacidades();
      await importPage.openImportDialog();

      // preview limpio -> Confirmar habilitado ...
      await importPage.mockPreview({
        total_records: 1,
        total_errores: 0,
        inserted: 0,
        rows: [
          { ID: 5, Clave: "D05", Nombre: "Auditiva II", Activo: "Si", ERROR: "" },
        ],
      });
      await importPage.uploadFile();
      await importPage.clickPreview();
      await expect(importPage.confirmButton).toBeEnabled();

      // ... pero otro usuario tomo el ID 5 entre el preview y el confirm:
      // el backend re-valida y rechaza con 409 todo-o-nada. El cliente
      // (`confirm()`) captura el 409 y re-llama a preview() para
      // reconstruir las filas -- por eso el mock de preview arriba debe
      // seguir sirviendo una respuesta (esta vez con el error real).
      await importPage.mockPreview({
        total_records: 1,
        total_errores: 1,
        inserted: 0,
        rows: [
          {
            ID: 5,
            Clave: "D05",
            Nombre: "Auditiva II",
            Activo: "Si",
            ERROR: "El ID ya existe en el catalogo. ",
          },
        ],
      });
      await importPage.mockConfirmRejected();
      await importPage.clickConfirm();

      await importPage.expectToastContains(
        "La importacion tiene filas con error",
      );
      await expect(importPage.dialog).toBeVisible();
      await expect(
        importPage.dialog.getByText("El ID ya existe en el catalogo."),
      ).toBeVisible();
      await expect(importPage.confirmButton).toBeDisabled();

      await importPage.unrouteAll();
    },
  );
});
