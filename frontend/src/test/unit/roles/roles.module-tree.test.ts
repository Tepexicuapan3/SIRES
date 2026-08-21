import { describe, expect, it } from "vitest";
import {
  buildPermissionModuleIndex,
  getCollateralModules,
  getModuleState,
  resolveNodePermissionIds,
} from "@/domains/auth-access/adapters/rbac/roles/roles.module-tree";
import type { ModuleCatalogNodeDTO, Permission } from "@api/types";

const node = (
  overrides: Partial<ModuleCatalogNodeDTO> & { key: string },
): ModuleCatalogNodeDTO => ({
  title: overrides.key,
  icon: null,
  url: null,
  group: "primary",
  isSection: false,
  permissions: [],
  items: [],
  ...overrides,
});

describe("getModuleState", () => {
  it("es 'unmanaged' cuando el nodo no declara ningun permiso propio", () => {
    const target = node({ key: "administracion.panel", permissions: [] });

    expect(getModuleState(target, new Set())).toBe("unmanaged");
    // ni siquiera un draft con codigos arbitrarios cambia el resultado:
    // un nodo sin permisos propios nunca es administrable.
    expect(getModuleState(target, new Set(["cualquier:codigo"]))).toBe(
      "unmanaged",
    );
  });

  it("es 'checked' cuando el rol tiene AL MENOS UNO de los permisos del nodo (OR)", () => {
    const target = node({
      key: "clinico.consultas.panel",
      permissions: ["clinico:consultas:read", "clinico:consultas:create"],
    });

    expect(
      getModuleState(target, new Set(["clinico:consultas:create"])),
    ).toBe("checked");
  });

  it("es 'unchecked' cuando el nodo tiene permisos administrables pero el rol no tiene ninguno", () => {
    const target = node({
      key: "clinico.consultas.panel",
      permissions: ["clinico:consultas:read"],
    });

    expect(
      getModuleState(target, new Set(["otro:permiso:no:relacionado"])),
    ).toBe("unchecked");
  });
});

describe("buildPermissionModuleIndex + getCollateralModules", () => {
  it("un nodo con permiso unico (no compartido) no tiene colaterales", () => {
    const tree: ModuleCatalogNodeDTO[] = [
      node({
        key: "administracion",
        isSection: true,
        items: [
          node({
            key: "administracion.panel",
            permissions: ["admin:gestion:panel:read"],
          }),
          node({
            key: "administracion.usuarios",
            permissions: ["admin:gestion:usuarios:read"],
          }),
        ],
      }),
    ];

    const index = buildPermissionModuleIndex(tree);
    const target = tree[0]!.items[0]!;

    expect(getCollateralModules(target, index)).toEqual([]);
  });

  it("un permiso compartido entre multiples nodos produce colaterales en ambos sentidos", () => {
    // 4 modulos comparten "clinico:consultas:read": tildar/destildar
    // cualquiera de ellos afecta a los otros 3.
    const sharedCode = "clinico:consultas:read";
    const tree: ModuleCatalogNodeDTO[] = [
      node({
        key: "clinico",
        isSection: true,
        items: [
          node({ key: "clinico.consultas.panel", permissions: [sharedCode] }),
          node({ key: "clinico.consultas.historial", permissions: [sharedCode] }),
          node({
            key: "clinico.consultas.resumen",
            permissions: [sharedCode, "clinico:consultas:export"],
          }),
        ],
      }),
      node({ key: "clinico.consultas.widget", permissions: [sharedCode] }),
    ];

    const index = buildPermissionModuleIndex(tree);

    expect(index.get(sharedCode)).toHaveLength(4);

    const panel = tree[0]!.items[0]!;
    const collateralOfPanel = getCollateralModules(panel, index);
    expect(collateralOfPanel.map((ref) => ref.key).sort()).toEqual(
      [
        "clinico.consultas.historial",
        "clinico.consultas.resumen",
        "clinico.consultas.widget",
      ].sort(),
    );

    // el nodo con un permiso extra ("export") no comparte ese segundo
    // codigo con nadie mas -- solo aporta colaterales via el compartido.
    const resumen = tree[0]!.items[2]!;
    const collateralOfResumen = getCollateralModules(resumen, index);
    expect(collateralOfResumen.map((ref) => ref.key).sort()).toEqual(
      [
        "clinico.consultas.historial",
        "clinico.consultas.panel",
        "clinico.consultas.widget",
      ].sort(),
    );
  });

  it("los nodos 'unmanaged' (sin permisos) no aportan ni reciben colaterales", () => {
    const tree: ModuleCatalogNodeDTO[] = [
      node({
        key: "administracion",
        isSection: true,
        permissions: [],
        items: [
          node({
            key: "administracion.panel",
            permissions: ["admin:gestion:panel:read"],
          }),
        ],
      }),
    ];

    const index = buildPermissionModuleIndex(tree);
    const seccionUnmanaged = tree[0]!;

    expect(getModuleState(seccionUnmanaged, new Set())).toBe("unmanaged");
    expect(getCollateralModules(seccionUnmanaged, index)).toEqual([]);
  });
});

describe("resolveNodePermissionIds", () => {
  const catalog: Permission[] = [
    {
      id: 10,
      code: "clinico:consultas:read",
      description: "Leer consultas",
      isSystem: false,
    },
    {
      id: 11,
      code: "clinico:consultas:create",
      description: "Crear consultas",
      isSystem: false,
    },
  ];

  it("resuelve todos los codigos del nodo a sus ids del catalogo", () => {
    const target = node({
      key: "clinico.consultas.panel",
      permissions: ["clinico:consultas:read", "clinico:consultas:create"],
    });

    const result = resolveNodePermissionIds(target, catalog);

    expect(result.ids.sort()).toEqual([10, 11]);
    expect(result.missingCodes).toEqual([]);
  });

  it("reporta como missingCodes los codigos que no estan en el catalogo (catalogo stale)", () => {
    const target = node({
      key: "clinico.consultas.panel",
      permissions: ["clinico:consultas:read", "clinico:consultas:delete"],
    });

    const result = resolveNodePermissionIds(target, catalog);

    expect(result.ids).toEqual([10]);
    expect(result.missingCodes).toEqual(["clinico:consultas:delete"]);
  });

  it("un nodo unmanaged (sin permisos) resuelve a listas vacias", () => {
    const target = node({ key: "administracion", permissions: [] });

    const result = resolveNodePermissionIds(target, catalog);

    expect(result.ids).toEqual([]);
    expect(result.missingCodes).toEqual([]);
  });
});
