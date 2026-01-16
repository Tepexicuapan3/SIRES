import { faker } from "@faker-js/faker";
import type { Permission, UserPermissionOverride } from "@/api/types/permissions.types";

// Categorías comunes en el sistema
const CATEGORIES = ["EXPEDIENTES", "USUARIOS", "REPORTES", "CONFIGURACION", "CONSULTAS"];

export const createMockPermission = (overrides: Partial<Permission> = {}): Permission => {
  const resource = faker.helpers.arrayElement(["expedientes", "usuarios", "consultas"]);
  const action = faker.helpers.arrayElement(["create", "read", "update", "delete"]);
  const code = `${resource}:${action}`;

  return {
    id_permission: faker.number.int({ min: 1, max: 200 }),
    code,
    resource,
    action,
    description: `Permite ${action} ${resource}`,
    category: faker.helpers.arrayElement(CATEGORIES),
    ...overrides,
  };
};

export const createMockUserOverride = (overrides: Partial<UserPermissionOverride> = {}): UserPermissionOverride => {
  const permission = createMockPermission();
  
  return {
    id_user_permission_override: faker.number.int({ min: 1, max: 1000 }),
    permission_code: permission.code,
    permission_description: permission.description,
    effect: faker.datatype.boolean() ? "ALLOW" : "DENY",
    expires_at: faker.date.future().toISOString(),
    is_expired: false,
    ...overrides,
  };
};
