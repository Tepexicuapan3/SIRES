import { faker } from "@faker-js/faker";
import type { Role, RoleWithCount } from "@/api/types/roles.types";

export const createMockRole = (overrides: Partial<Role> = {}): Role => {
  const roleName = faker.person.jobType().toUpperCase().replace(/\s+/g, "_");
  
  return {
    id_rol: faker.number.int({ min: 1, max: 100 }),
    rol: roleName,
    desc_rol: faker.person.jobDescriptor(),
    est_rol: "A",
    landing_route: "/dashboard",
    priority: faker.number.int({ min: 1, max: 999 }),
    is_admin: 0,
    usr_alta: "SYSTEM",
    fch_alta: new Date().toISOString(),
    ...overrides,
  };
};

export const createMockRoleWithCount = (overrides: Partial<RoleWithCount> = {}): RoleWithCount => {
  const baseRole = createMockRole(overrides);
  return {
    ...baseRole,
    permissions_count: faker.number.int({ min: 5, max: 50 }),
    users_count: faker.number.int({ min: 0, max: 20 }),
    ...overrides,
  };
};
