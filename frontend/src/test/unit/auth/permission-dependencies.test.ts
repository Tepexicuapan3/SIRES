import { describe, expect, it } from "vitest";
import {
  evaluatePermissionDependencies,
  evaluatePermissionRequirement,
  getPermissionDependencyClosure,
} from "@/features/auth/domain/permission-dependencies";

describe("permission dependencies", () => {
  it("resolves explicit and inferred dependencies for users update", () => {
    const closure = getPermissionDependencyClosure(
      "admin:gestion:usuarios:update",
    );

    expect(closure).toEqual([
      "admin:gestion:permisos:read",
      "admin:gestion:roles:read",
      "admin:gestion:usuarios:read",
      "admin:gestion:usuarios:update",
    ]);
  });

  it("blocks mutating permissions when dependency chain is incomplete", () => {
    const state = evaluatePermissionDependencies(
      "admin:gestion:usuarios:update",
      ["admin:gestion:usuarios:update", "admin:gestion:usuarios:read"],
    );

    expect(state.granted).toBe(false);
    expect(state.missingPermissions).toEqual([
      "admin:gestion:permisos:read",
      "admin:gestion:roles:read",
    ]);
  });

  it("grants mutating permission when all dependencies are present", () => {
    const state = evaluatePermissionDependencies(
      "admin:gestion:usuarios:update",
      [
        "admin:gestion:usuarios:update",
        "admin:gestion:usuarios:read",
        "admin:gestion:roles:read",
        "admin:gestion:permisos:read",
      ],
    );

    expect(state.granted).toBe(true);
    expect(state.missingPermissions).toEqual([]);
  });

  it("infers same-resource read dependency for catalog mutations", () => {
    const state = evaluatePermissionDependencies(
      "admin:catalogos:areas:create",
      ["admin:catalogos:areas:create"],
    );

    expect(state.granted).toBe(false);
    expect(state.missingPermissions).toEqual(["admin:catalogos:areas:read"]);
  });

  it("evaluates composed requirements with allOf and anyOf", () => {
    const state = evaluatePermissionRequirement(
      {
        allOf: ["admin:gestion:usuarios:read"],
        anyOf: ["admin:gestion:usuarios:update", "admin:gestion:roles:update"],
      },
      [
        "admin:gestion:usuarios:read",
        "admin:gestion:roles:update",
        "admin:gestion:roles:read",
        "admin:gestion:permisos:read",
      ],
    );

    expect(state.granted).toBe(true);
    expect(state.missingAllOf).toEqual([]);
    expect(state.missingAnyOf).toEqual([]);
  });

  it("keeps admin wildcard as immediate pass", () => {
    const state = evaluatePermissionDependencies(
      "admin:gestion:usuarios:update",
      ["*"],
    );

    expect(state.granted).toBe(true);
    expect(state.missingPermissions).toEqual([]);
  });
});
