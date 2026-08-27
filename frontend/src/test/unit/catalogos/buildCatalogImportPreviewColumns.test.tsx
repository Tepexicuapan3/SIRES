import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/test/utils";
import { buildCatalogImportPreviewColumns } from "@features/admin/modules/catalogos/shared/import/buildCatalogImportPreviewColumns";
import {
  DISCAPACIDADES_IMPORT_CONFIG,
  ESCUELAS_IMPORT_CONFIG,
  ESPECIALIDADES_IMPORT_CONFIG,
} from "@features/admin/modules/catalogos/shared/import/catalog-import.config";
import type { CatalogImportRow } from "@api/resources/catalogos/catalog-import.api";

describe("buildCatalogImportPreviewColumns", () => {
  it("builds columns from the discapacidades config, in order, plus a trailing ERROR column", () => {
    const columns = buildCatalogImportPreviewColumns(
      DISCAPACIDADES_IMPORT_CONFIG,
    );

    expect(columns.map((column) => column.key)).toEqual([
      "ID",
      "Clave",
      "Nombre",
      "Activo",
      "ERROR",
    ]);
  });

  it("builds columns from the escuelas config, including Clave", () => {
    const columns = buildCatalogImportPreviewColumns(ESCUELAS_IMPORT_CONFIG);

    expect(columns.map((column) => column.key)).toEqual([
      "ID",
      "Clave",
      "Nombre",
      "Activo",
      "ERROR",
    ]);
  });

  it("omits Clave for especialidades, matching the backend spec (no Codigo column)", () => {
    const columns = buildCatalogImportPreviewColumns(
      ESPECIALIDADES_IMPORT_CONFIG,
    );

    expect(columns.map((column) => column.key)).toEqual([
      "ID",
      "Nombre",
      "Activo",
      "ERROR",
    ]);
  });

  it("renders each data column's value from the row, keyed by the exact backend header", () => {
    const columns = buildCatalogImportPreviewColumns(
      DISCAPACIDADES_IMPORT_CONFIG,
    );
    const row: CatalogImportRow = {
      ID: 7,
      Clave: "D07",
      Nombre: "Auditiva",
      Activo: "Si",
      ERROR: "",
    };

    const idColumn = columns.find((column) => column.key === "ID");
    const claveColumn = columns.find((column) => column.key === "Clave");
    const nombreColumn = columns.find((column) => column.key === "Nombre");
    const activoColumn = columns.find((column) => column.key === "Activo");

    expect(idColumn?.render?.(row)).toBe("7");
    expect(claveColumn?.render?.(row)).toBe("D07");
    expect(nombreColumn?.render?.(row)).toBe("Auditiva");
    expect(activoColumn?.render?.(row)).toBe("Si");
  });

  it("falls back to an empty string when a configured column key is missing from the row", () => {
    const columns = buildCatalogImportPreviewColumns(
      ESPECIALIDADES_IMPORT_CONFIG,
    );
    const row: CatalogImportRow = { ID: 3, Nombre: "Cardiologia", ERROR: "" };

    const activoColumn = columns.find((column) => column.key === "Activo");

    expect(activoColumn?.render?.(row)).toBe("");
  });

  it("renders a critical badge with the trimmed error message when the row has an ERROR", () => {
    const columns = buildCatalogImportPreviewColumns(
      DISCAPACIDADES_IMPORT_CONFIG,
    );
    const errorColumn = columns.find((column) => column.key === "ERROR");
    const row: CatalogImportRow = {
      ID: 7,
      Clave: "",
      Nombre: "",
      Activo: "Si",
      ERROR: "Nombre vacio. ",
    };

    render(<>{errorColumn?.render?.(row)}</>);

    expect(screen.getByText("Nombre vacio.")).toBeVisible();
  });

  it("renders a 'Sin errores' badge when the row ERROR is empty", () => {
    const columns = buildCatalogImportPreviewColumns(
      DISCAPACIDADES_IMPORT_CONFIG,
    );
    const errorColumn = columns.find((column) => column.key === "ERROR");
    const row: CatalogImportRow = {
      ID: 7,
      Clave: "D07",
      Nombre: "Auditiva",
      Activo: "Si",
      ERROR: "",
    };

    render(<>{errorColumn?.render?.(row)}</>);

    expect(screen.getByText("Sin errores")).toBeVisible();
  });

  it("treats a whitespace-only ERROR as no error (rowHasError trims before checking)", () => {
    const columns = buildCatalogImportPreviewColumns(
      DISCAPACIDADES_IMPORT_CONFIG,
    );
    const errorColumn = columns.find((column) => column.key === "ERROR");
    const row: CatalogImportRow = {
      ID: 7,
      Clave: "D07",
      Nombre: "Auditiva",
      Activo: "Si",
      ERROR: "   ",
    };

    render(<>{errorColumn?.render?.(row)}</>);

    expect(screen.getByText("Sin errores")).toBeVisible();
  });
});
