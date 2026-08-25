import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
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
        isExpanded={false}
        onToggleExpand={noop}
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

  it("deshabilita mover-a-carpeta y ocultar en un nodo de sistema", async () => {
    const user = userEvent.setup();
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
        isExpanded={false}
        onToggleExpand={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        onMoveToFolder={onMoveToFolder}
        onEdit={noop}
        onToggleVisibility={onToggleVisibility}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /ver información y acciones de vacunas/i,
      }),
    );

    expect(
      await screen.findByRole("menuitem", { name: /mover a otra carpeta/i }),
    ).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("menuitem", { name: /ocultar del menú/i }),
    ).toHaveAttribute("data-disabled");
  });

  it("no deshabilita editar en un nodo de sistema", async () => {
    const user = userEvent.setup();

    render(
      <ModuleTreeRow
        node={{ ...baseNode, isSystem: true }}
        depth={0}
        canMoveUp={false}
        canMoveDown={false}
        canUpdate
        canDelete
        isBusy={false}
        isExpanded={false}
        onToggleExpand={noop}
        onMoveUp={noop}
        onMoveDown={noop}
        onMoveToFolder={noop}
        onEdit={noop}
        onToggleVisibility={noop}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /ver información y acciones de vacunas/i,
      }),
    );

    expect(
      await screen.findByRole("menuitem", { name: /^editar$/i }),
    ).not.toHaveAttribute("data-disabled");
  });
});
