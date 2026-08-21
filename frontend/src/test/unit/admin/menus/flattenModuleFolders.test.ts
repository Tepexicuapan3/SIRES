import { describe, expect, it } from "vitest";
import { flattenModuleFolders } from "@features/admin/modules/menus/domain/flattenModuleFolders";
import type { ModuleCatalogNodeDTO } from "@api/types";

const buildNode = (
  overrides: Partial<ModuleCatalogNodeDTO> & { key: string },
): ModuleCatalogNodeDTO => ({
  title: overrides.key,
  icon: null,
  url: null,
  group: "primary",
  isSection: false,
  isSystem: false,
  isActive: true,
  permissions: [],
  items: [],
  ...overrides,
});

const TREE: ModuleCatalogNodeDTO[] = [
  buildNode({
    key: "administracion",
    isSection: true,
    items: [
      buildNode({
        key: "administracion.panel",
        isSection: true,
        items: [
          buildNode({ key: "administracion.panel.roles", isSection: false }),
        ],
      }),
    ],
  }),
  buildNode({ key: "farmacia", isSection: true, items: [] }),
  buildNode({ key: "dashboard", isSection: false }),
];

describe("flattenModuleFolders", () => {
  it("solo incluye nodos isSection, en orden depth-first con su profundidad", () => {
    const options = flattenModuleFolders(TREE);

    expect(options).toEqual([
      { key: "administracion", title: "administracion", depth: 0, isSystem: false },
      {
        key: "administracion.panel",
        title: "administracion.panel",
        depth: 1,
        isSystem: false,
      },
      { key: "farmacia", title: "farmacia", depth: 0, isSystem: false },
    ]);
  });

  it("excluye el nodo indicado y TODO su subarbol cuando se pasa excludeSubtreeOf", () => {
    const options = flattenModuleFolders(TREE, {
      excludeSubtreeOf: "administracion",
    });

    expect(options.map((option) => option.key)).toEqual(["farmacia"]);
  });

  it("no excluye nada si excludeSubtreeOf es null/undefined", () => {
    const options = flattenModuleFolders(TREE, { excludeSubtreeOf: null });
    expect(options.map((option) => option.key)).toEqual([
      "administracion",
      "administracion.panel",
      "farmacia",
    ]);
  });
});
