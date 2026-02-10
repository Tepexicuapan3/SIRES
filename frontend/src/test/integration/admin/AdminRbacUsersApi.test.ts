import { beforeEach, describe, expect, it } from "vitest";
// @vitest-environment node
import { usersAPI } from "@/api/resources/users.api";
import { authAPI } from "@/api/resources/auth.api";

describe("Admin RBAC Users API (with MSW)", () => {
  beforeEach(async () => {
    await authAPI.login({ username: "admin", password: "password123" });
  });

  it("lists users with pagination", async () => {
    const response = await usersAPI.getAll({ page: 1, pageSize: 10 });

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.page).toBe(1);
    expect(response.pageSize).toBe(10);
  });

  it("creates and updates a user", async () => {
    const created = await usersAPI.create({
      username: "rbac_api_user",
      firstName: "Rbac",
      paternalName: "Api",
      maternalName: "Test",
      email: "rbac.api.user@metro.cdmx.gob.mx",
      clinicId: null,
      primaryRoleId: 1,
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.temporaryPassword).toBeTruthy();

    const updated = await usersAPI.update(created.id, {
      email: "rbac.api.user.updated@metro.cdmx.gob.mx",
    });

    expect(updated.user.id).toBe(created.id);
    expect(updated.user.email).toBe("rbac.api.user.updated@metro.cdmx.gob.mx");
  });

  it("activates and deactivates users", async () => {
    const deactivated = await usersAPI.deactivate(1);
    expect(deactivated).toEqual({ id: 1, isActive: false });

    const activated = await usersAPI.activate(1);
    expect(activated).toEqual({ id: 1, isActive: true });
  });

  it("manages user roles", async () => {
    const assigned = await usersAPI.roles.assign(1, { roleIds: [3] });
    expect(assigned.roles.some((role) => role.id === 3)).toBe(true);

    const primary = await usersAPI.roles.setPrimary(1, { roleId: 3 });
    expect(primary.roles.find((role) => role.id === 3)?.isPrimary).toBe(true);

    const revoked = await usersAPI.roles.revoke(1, 3);
    expect(revoked.roles.some((role) => role.id === 3)).toBe(false);
  });

  it("rejects removing the last role", async () => {
    await expect(usersAPI.roles.revoke(1, 1)).rejects.toThrow();
  });

  it("manages user overrides", async () => {
    const added = await usersAPI.overrides.add(1, {
      permissionCode: "admin:gestion:usuarios:update",
      effect: "DENY",
    });

    expect(
      added.overrides.some(
        (override) =>
          override.permissionCode === "admin:gestion:usuarios:update",
      ),
    ).toBe(true);

    const removed = await usersAPI.overrides.remove(
      1,
      "admin:gestion:usuarios:update",
    );

    expect(
      removed.overrides.some(
        (override) =>
          override.permissionCode === "admin:gestion:usuarios:update",
      ),
    ).toBe(false);
  });
});
