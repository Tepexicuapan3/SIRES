import { describe, it, expect } from "vitest";
// @vitest-environment node
import { rolesAPI } from "@/api/resources/roles.api";
import { permissionsAPI } from "@/api/resources/permissions.api";

describe("Admin RBAC Integration (with MSW)", () => {
  // 1. Catálogo de Permisos
  it("should fetch permissions catalog", async () => {
    const response = await permissionsAPI.getAll();
    expect(response.items.length).toBeGreaterThan(0);

    // Validar estructura de permiso
    const perm = response.items[0];
    expect(perm).toHaveProperty("code");
    expect(perm.code).toContain(":"); // formato resource:action
  });

  // 2. Crear un Rol
  it("should create a new role", async () => {
    const newRole = await rolesAPI.create({
      name: "TEST_ROLE",
      description: "Rol de prueba",
      landingRoute: "/test",
    });

    expect(newRole).toBeDefined();
    expect(newRole.name).toBe("TEST_ROLE");
    expect(newRole.id).toBeGreaterThan(0);
  });

  // 3. Flujo completo: Rol + Permisos
  it("should manage role permissions", async () => {
    // a. Obtener permisos de un rol existente
    // Usamos ID 1 (Admin) que sabemos que existe en el mock
    const rolePerms = await rolesAPI.getById(1); // getById devuelve { role, permissions }
    expect(rolePerms).toBeDefined();
    expect(rolePerms.permissions).toBeDefined();

    // b. Asignar permiso
    // Nota: assign espera un objeto con roleId y permissionIds
    await expect(
      rolesAPI.permissions.assign({
        roleId: 1,
        permissionIds: [10],
      }),
    ).resolves.not.toThrow();

    // c. Revocar permiso
    await expect(rolesAPI.permissions.revoke(1, 10)).resolves.not.toThrow();
  });

  // 4. Protección de Roles de Sistema
  it("should protect system roles from modification", async () => {
    // ID 1 es Admin (sistema)
    await expect(
      rolesAPI.update(1, { description: "Hacked" }),
    ).rejects.toThrow();

    await expect(rolesAPI.delete(1)).rejects.toThrow();
  });
});
