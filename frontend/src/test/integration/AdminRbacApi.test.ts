import { describe, it, expect } from "vitest";
import { rolesAPI } from "@/api/resources/roles.api";
import { permissionsAPI } from "@/api/resources/permissions.api";

describe("Admin RBAC Integration (with MSW)", () => {
  
  // 1. Catálogo de Permisos
  it("should fetch permissions catalog", async () => {
    const response = await permissionsAPI.getPermissions();
    expect(response.length).toBeGreaterThan(0);
    
    // Validar estructura de permiso
    const perm = response[0];
    expect(perm).toHaveProperty("code");
    expect(perm.code).toContain(":"); // formato resource:action
  });

  // 2. Crear un Rol
  it("should create a new role", async () => {
    const newRole = await rolesAPI.createRole({
      rol: "TEST_ROLE",
      desc_rol: "Rol de prueba",
      landing_route: "/test",
      priority: 100,
      is_admin: false
    });

    expect(newRole).toBeDefined();
    expect(newRole.rol).toBe("TEST_ROLE");
    // El mock debe asignar un ID
    expect(newRole.id_rol).toBeGreaterThan(0);
  });

  // 3. Flujo completo: Rol + Permisos
  it("should manage role permissions", async () => {
    // a. Obtener permisos de un rol existente
    // Usamos ID 1 (Admin) que sabemos que existe en el mock
    const rolePerms = await rolesAPI.getRole(1); // getRole devuelve { role, permissions }
    expect(rolePerms).toBeDefined();
    expect(rolePerms.permissions).toBeDefined();
    
    // b. Asignar permiso
    // Nota: assignPermissions espera un objeto con role_id y permission_ids array
    await expect(rolesAPI.assignPermissions({
        role_id: 1,
        permission_ids: [10]
    })).resolves.not.toThrow();
    
    // c. Revocar permiso
    await expect(rolesAPI.revokePermission(1, 10)).resolves.not.toThrow();
  });

  // 4. Protección de Roles de Sistema
  it("should protect system roles from modification", async () => {
    // ID 1 es Admin (sistema)
    await expect(rolesAPI.updateRole(1, { desc_rol: "Hacked" }))
      .rejects.toThrow(); // Axios lanza error 403
      
    await expect(rolesAPI.deleteRole(1))
      .rejects.toThrow();
  });

});
