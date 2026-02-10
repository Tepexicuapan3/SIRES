import { describe, expect, it } from "vitest";
import {
  buildPermissionHierarchy,
  comparePermissionCodesByHierarchy,
  parsePermissionCode,
} from "@features/admin/modules/rbac/shared/utils/permission-hierarchy";

describe("permission-hierarchy utils", () => {
  it("parses full permission code hierarchy", () => {
    expect(parsePermissionCode("admin:gestion:usuarios:update")).toEqual({
      group: "admin",
      module: "gestion",
      submodule: "usuarios",
      action: "update",
    });
  });

  it("uses general submodule for 3-segment permissions", () => {
    expect(parsePermissionCode("clinico:consultas:read")).toEqual({
      group: "clinico",
      module: "consultas",
      submodule: "general",
      action: "read",
    });
  });

  it("sorts permission codes by hierarchy and action priority", () => {
    const sorted = [
      "admin:gestion:roles:update",
      "admin:gestion:roles:read",
      "admin:gestion:roles:create",
    ].sort(comparePermissionCodesByHierarchy);

    expect(sorted).toEqual([
      "admin:gestion:roles:read",
      "admin:gestion:roles:create",
      "admin:gestion:roles:update",
    ]);
  });

  it("builds grouped hierarchy with total counters", () => {
    const hierarchy = buildPermissionHierarchy([
      {
        id: "1",
        code: "admin:gestion:roles:read",
        description: "Leer roles",
        payload: { id: 1 },
      },
      {
        id: "2",
        code: "admin:gestion:roles:update",
        description: "Editar roles",
        payload: { id: 2 },
      },
      {
        id: "3",
        code: "clinico:consultas:read",
        description: "Leer consultas",
        payload: { id: 3 },
      },
    ]);

    expect(hierarchy).toHaveLength(2);
    expect(hierarchy[0].totalCount).toBeGreaterThan(0);
    expect(hierarchy[0].modules[0].submodules[0].actions).toHaveLength(2);
  });
});
