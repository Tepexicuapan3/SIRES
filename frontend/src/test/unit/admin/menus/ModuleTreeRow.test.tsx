import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { ModuleTreeRow } from "@features/admin/modules/menus/components/ModuleTreeRow";
import type { ModuleCatalogNodeDTO } from "@api/types";

const baseNode: ModuleCatalogNodeDTO = {
  key: "farmacia.panel.vacunas",
  title: "Vacunas",
  icon: "pill",
  url: "/farmacia/vacunas",
  group: "primary",
  isSection: false,
  isSystem: false,
  isActive: true,
  permissions: ["farmacia:vacunas:read", "farmacia:vacunas:write"],
  items: [],
};

const noop = () => {};

describe("ModuleTreeRow", () => {
  it("nunca muestra un codigo de permiso crudo como texto visible", () => {
    render(
      <ModuleTreeRow
        node={baseNode}
        depth={0}
        canMoveUp
        canMoveDown
        canUpdate
        canDelete
        isBusy={false}
        onMoveUp={noop}
        onMoveDown={noop}
        onMoveToFolder={noop}
        onEdit={noop}
        onToggleVisibility={noop}
      />,
    );

    expect(screen.getByText("Vacunas")).toBeInTheDocument();
    expect(screen.queryByText(/farmacia:vacunas/)).not.toBeInTheDocument();
  });

  it("deshabilita mover-a-carpeta y ocultar en un nodo de sistema", () => {
    const onMoveToFolder = vi.fn();
    const onToggleVisibility = vi.fn();

    render(
      <ModuleTreeRow
        node={{ ...baseNode, isSystem: true }}
        depth={0}
        canMoveUp
        canMoveDown
        canUpdate
        canDelete
        isBusy={false}
        onMoveUp={noop}
        onMoveDown={noop}
        onMoveToFolder={onMoveToFolder}
        onEdit={noop}
        onToggleVisibility={onToggleVisibility}
      />,
    );

    expect(
      screen.getByRole("button", { name: /mover vacunas a otra carpeta/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /ocultar vacunas del menú/i }),
    ).toBeDisabled();
  });

  it("no deshabilita editar en un nodo de sistema", () => {
    render(
      <ModuleTreeRow
        node={{ ...baseNode, isSystem: true }}
        depth={0}
        canMoveUp={false}
        canMoveDown={false}
        canUpdate
        canDelete
        isBusy={false}
        onMoveUp={noop}
        onMoveDown={noop}
        onMoveToFolder={noop}
        onEdit={noop}
        onToggleVisibility={noop}
      />,
    );

    expect(
      screen.getByRole("button", { name: /editar vacunas/i }),
    ).not.toBeDisabled();
  });
});
