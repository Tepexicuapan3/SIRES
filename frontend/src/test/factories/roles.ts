import { faker } from "@faker-js/faker";
import type {
  RoleDetail,
  RoleListItem,
  RolePermission,
} from "@/api/types/roles.types";
import type { UserRef } from "@/api/types/users.types";

const createUserRef = (overrides: Partial<UserRef> = {}): UserRef => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.person.fullName(),
  ...overrides,
});

export const createMockRoleListItem = (
  overrides: Partial<RoleListItem> = {},
): RoleListItem => {
  const roleName = faker.person.jobType().toUpperCase().replace(/\s+/g, "_");

  return {
    id: faker.number.int({ min: 1, max: 100 }),
    name: roleName,
    description: faker.person.jobDescriptor(),
    isActive: true,
    isSystem: false,
    landingRoute: "/dashboard",
    permissionsCount: faker.number.int({ min: 5, max: 50 }),
    usersCount: faker.number.int({ min: 0, max: 20 }),
    ...overrides,
  };
};

export const createMockRoleDetail = (
  overrides: Partial<RoleDetail> = {},
): RoleDetail => {
  const baseRole = createMockRoleListItem(overrides);

  return {
    ...baseRole,
    createdAt: faker.date.past().toISOString(),
    createdBy: createUserRef(),
    updatedAt: null,
    updatedBy: null,
    ...overrides,
  };
};

export const createMockRolePermission = (
  overrides: Partial<RolePermission> = {},
): RolePermission => {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    code: `${faker.helpers.arrayElement(["admin", "clinico", "recepcion"])}:${faker.helpers.arrayElement(
      ["usuarios", "roles", "consultas"],
    )}:${faker.helpers.arrayElement(["read", "create", "update", "delete"])}`,
    description: faker.lorem.sentence(5),
    assignedAt: faker.date.recent().toISOString(),
    assignedBy: createUserRef(),
    ...overrides,
  };
};
