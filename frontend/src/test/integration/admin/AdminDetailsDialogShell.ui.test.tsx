import { describe, expect, it, vi } from "vitest";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import { Button } from "@shared/ui/button";
import { render, screen } from "@/test/utils";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";

interface RenderDialogShellOptions {
  sections?: AdminDetailsDialogSection[];
  isDirty?: boolean;
}

const createSections = (count: 1 | 2): AdminDetailsDialogSection[] => {
  const base: AdminDetailsDialogSection[] = [
    {
      id: "general",
      label: "General",
      content: <div>Contenido general</div>,
    },
  ];

  if (count === 2) {
    base.push({
      id: "permissions",
      label: "Permisos",
      content: <div>Contenido permisos</div>,
    });
  }

  return base;
};

const renderDialogShell = ({
  sections = createSections(2),
  isDirty = false,
}: RenderDialogShellOptions = {}) => {
  const onOpenChange = vi.fn();
  const onRequestClose = vi.fn();

  render(
    <AdminDetailsDialogShell
      open
      onOpenChange={onOpenChange}
      onRequestClose={onRequestClose}
      titleSrOnly="Detalle"
      descriptionSrOnly="Dialogo de prueba"
      header={<div>Cabecera</div>}
      sections={sections}
      isDirty={isDirty}
      footer={({ onCancel }) => (
        <div>
          <Button type="button" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      )}
    />,
  );

  return {
    onOpenChange,
    onRequestClose,
  };
};

describe("AdminDetailsDialogShell UI", () => {
  it("hides tabs when only one section exists", () => {
    renderDialogShell({ sections: createSections(1) });

    expect(screen.getByText("Contenido general")).toBeVisible();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders tabs when multiple sections exist", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });

    renderDialogShell({ sections: createSections(2) });

    expect(screen.getByRole("tab", { name: "General" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Permisos" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Permisos" }));

    expect(screen.getByText("Contenido permisos")).toBeVisible();
  });

  it("closes directly when no unsaved changes", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    const { onRequestClose } = renderDialogShell({ isDirty: false });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("heading", { name: "Salir sin guardar" }),
    ).not.toBeInTheDocument();
  });

  it("asks for confirmation when there are unsaved changes", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    const { onRequestClose } = renderDialogShell({ isDirty: true });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.getByRole("heading", { name: "Salir sin guardar" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Editar" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Salir" }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });
});
