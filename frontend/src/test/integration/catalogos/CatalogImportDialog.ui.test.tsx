import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/test/utils";
import { toast } from "sonner";
import { CatalogImportDialog } from "@features/admin/modules/catalogos/shared/import/CatalogImportDialog";
import { DISCAPACIDADES_IMPORT_CONFIG } from "@features/admin/modules/catalogos/shared/import/catalog-import.config";
import { useCatalogImportPreview } from "@features/admin/modules/catalogos/shared/import/useCatalogImportPreview";
import { useCatalogImportConfirm } from "@features/admin/modules/catalogos/shared/import/useCatalogImportConfirm";
import { useCatalogTemplateDownload } from "@features/admin/modules/catalogos/shared/import/useCatalogTemplateDownload";
import type { CatalogImportResponse } from "@api/resources/catalogos/catalog-import.api";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock(
  "@features/admin/modules/catalogos/shared/import/useCatalogImportPreview",
  () => ({
    useCatalogImportPreview: vi.fn(),
  }),
);

vi.mock(
  "@features/admin/modules/catalogos/shared/import/useCatalogImportConfirm",
  () => ({
    useCatalogImportConfirm: vi.fn(),
  }),
);

vi.mock(
  "@features/admin/modules/catalogos/shared/import/useCatalogTemplateDownload",
  () => ({
    useCatalogTemplateDownload: vi.fn(),
  }),
);

const buildFile = () =>
  new File(["dummy"], "discapacidades.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

const buildResult = (
  overrides: Partial<CatalogImportResponse> = {},
): CatalogImportResponse => ({
  total_records: 2,
  total_errores: 0,
  inserted: 0,
  rows: [
    { ID: 1, Clave: "D01", Nombre: "Visual", Activo: "Si", ERROR: "" },
    { ID: 2, Clave: "D02", Nombre: "Auditiva", Activo: "Si", ERROR: "" },
  ],
  ...overrides,
});

describe("CatalogImportDialog", () => {
  const onOpenChange = vi.fn();
  const onImported = vi.fn();
  const previewMutateAsync = vi.fn();
  const confirmMutateAsync = vi.fn();
  const download = vi.fn();

  beforeEach(() => {
    vi.mocked(useCatalogImportPreview).mockReturnValue({
      mutateAsync: previewMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCatalogImportPreview>);

    vi.mocked(useCatalogImportConfirm).mockReturnValue({
      mutateAsync: confirmMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCatalogImportConfirm>);

    vi.mocked(useCatalogTemplateDownload).mockReturnValue({
      download,
      isDownloading: false,
    });

    onOpenChange.mockClear();
    onImported.mockClear();
    previewMutateAsync.mockReset();
    confirmMutateAsync.mockReset();
    download.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  const renderDialog = () =>
    render(
      <CatalogImportDialog
        open
        onOpenChange={onOpenChange}
        config={DISCAPACIDADES_IMPORT_CONFIG}
        onImported={onImported}
      />,
    );

  const uploadAndPreview = async (
    user: ReturnType<typeof userEvent.setup>,
    result: CatalogImportResponse,
  ) => {
    previewMutateAsync.mockResolvedValueOnce(result);
    await user.upload(screen.getByLabelText("Archivo Excel"), buildFile());
    await user.click(
      screen.getByRole("button", { name: "Previsualizar informacion" }),
    );
    await waitFor(() => {
      expect(previewMutateAsync).toHaveBeenCalledWith({
        slug: "disabilities",
        file: expect.any(File),
      });
    });
  };

  it("downloads the template via the download hook", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("button", { name: /Descargar plantilla/ }),
    );

    expect(download).toHaveBeenCalledTimes(1);
  });

  it("keeps Confirmar disabled while the preview has error rows", async () => {
    const user = userEvent.setup();
    renderDialog();

    await uploadAndPreview(
      user,
      buildResult({
        total_records: 2,
        total_errores: 1,
        rows: [
          { ID: 1, Clave: "D01", Nombre: "Visual", Activo: "Si", ERROR: "" },
          {
            ID: 2,
            Clave: "D02",
            Nombre: "",
            Activo: "Si",
            ERROR: "Nombre vacio. ",
          },
        ],
      }),
    );

    expect(
      await screen.findByText("La importacion tiene filas con error"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirmar importacion" }),
    ).toBeDisabled();
  });

  it("enables Confirmar once the preview reports zero errors", async () => {
    const user = userEvent.setup();
    renderDialog();

    await uploadAndPreview(user, buildResult({ total_errores: 0 }));

    expect(await screen.findByText("Vista previa lista")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirmar importacion" }),
    ).toBeEnabled();
  });

  it("shows total_records and total_errores counters after previewing", async () => {
    const user = userEvent.setup();
    renderDialog();

    await uploadAndPreview(
      user,
      buildResult({ total_records: 5, total_errores: 2 }),
    );

    await screen.findByText("La importacion tiene filas con error");

    const totalLabel = screen.getByText("Total de filas");
    const totalCard = totalLabel.parentElement as HTMLElement;
    expect(within(totalCard).getByText("5")).toBeVisible();

    const erroresLabel = screen.getByText("Filas con error");
    const erroresCard = erroresLabel.parentElement as HTMLElement;
    expect(within(erroresCard).getByText("2")).toBeVisible();
    expect(within(erroresCard).getByText("Con errores")).toBeVisible();
  });

  it("renders an ERROR badge per row: the error message for invalid rows, 'Sin errores' for valid ones", async () => {
    const user = userEvent.setup();
    renderDialog();

    await uploadAndPreview(
      user,
      buildResult({
        total_records: 2,
        total_errores: 1,
        rows: [
          { ID: 1, Clave: "D01", Nombre: "Visual", Activo: "Si", ERROR: "" },
          {
            ID: 2,
            Clave: "D02",
            Nombre: "",
            Activo: "Si",
            ERROR: "Nombre vacio. ",
          },
        ],
      }),
    );

    await screen.findByText("La importacion tiene filas con error");
    const table = screen.getByRole("table");
    expect(within(table).getByText("Nombre vacio.")).toBeVisible();
    expect(within(table).getByText("Sin errores")).toBeVisible();
  });

  it("on successful confirm: toasts success, calls onImported, and closes the dialog", async () => {
    const user = userEvent.setup();
    renderDialog();

    await uploadAndPreview(user, buildResult({ total_errores: 0 }));
    await screen.findByText("Vista previa lista");

    confirmMutateAsync.mockResolvedValueOnce(
      buildResult({ total_records: 2, total_errores: 0, inserted: 2 }),
    );

    await user.click(
      screen.getByRole("button", { name: "Confirmar importacion" }),
    );

    await waitFor(() => {
      expect(confirmMutateAsync).toHaveBeenCalledWith({
        slug: "disabilities",
        file: expect.any(File),
      });
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Importacion completada",
        expect.objectContaining({
          description: expect.stringContaining("2 registros importados"),
        }),
      );
    });
    expect(onImported).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("on all-or-nothing rejection (confirm resolves with total_errores > 0, does not throw): keeps the dialog open, shows the errors, and does not call onImported", async () => {
    const user = userEvent.setup();
    renderDialog();

    await uploadAndPreview(user, buildResult({ total_errores: 0 }));
    await screen.findByText("Vista previa lista");

    confirmMutateAsync.mockResolvedValueOnce(
      buildResult({
        total_records: 2,
        total_errores: 1,
        inserted: 0,
        rows: [
          { ID: 1, Clave: "D01", Nombre: "Visual", Activo: "Si", ERROR: "" },
          {
            ID: 2,
            Clave: "D02",
            Nombre: "",
            Activo: "Si",
            ERROR: "Nombre vacio. ",
          },
        ],
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Confirmar importacion" }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "La importacion tiene filas con error",
        expect.objectContaining({
          description:
            "No se importo ningun registro. Corrige el archivo y vuelve a intentar.",
        }),
      );
    });
    expect(onImported).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(
      await screen.findByText("La importacion tiene filas con error"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirmar importacion" }),
    ).toBeDisabled();
  });
});
