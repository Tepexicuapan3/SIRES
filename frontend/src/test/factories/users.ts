import { faker } from "@faker-js/faker";
import type { AuthUser } from "@/api/types/auth.types";
import type {
  UserDetail,
  UserListItem,
  UserRole,
} from "@/api/types/users.types";
import { createMockCentroAtencionRef } from "@/test/factories/centros-atencion";

export const createMockAuthUser = (
  overrides: Partial<AuthUser> = {},
): AuthUser => {
  const firstName = faker.person.firstName();
  const paternalName = faker.person.lastName();
  const maternalName = faker.person.lastName();
  const fullName = `${firstName} ${paternalName} ${maternalName}`;
  const mustChangePassword = overrides.mustChangePassword ?? false;
  const requiresOnboarding = overrides.requiresOnboarding ?? mustChangePassword;

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    username: faker.internet.username({ firstName, lastName: paternalName }),
    fullName,
    email: faker.internet.email({ firstName, lastName: paternalName }),
    primaryRole: "ADMIN",
    landingRoute: "/dashboard",
    roles: ["ADMIN", "MEDICO"],
    permissions: ["*"],
    mustChangePassword,
    requiresOnboarding,
    ...overrides,
  };
};

export const createMockUser = (
  overrides: Partial<UserListItem> = {},
): UserListItem => {
  const firstName = faker.person.firstName();
  const paternalName = faker.person.lastName();
  const maternalName = faker.person.lastName();
  const fullname = `${firstName} ${paternalName} ${maternalName}`;
  const clinic =
    overrides.clinic !== undefined
      ? overrides.clinic
      : faker.datatype.boolean()
        ? createMockCentroAtencionRef()
        : null;

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    username: faker.internet.username({ firstName, lastName: paternalName }),
    fullname,
    email: faker.internet.email({ firstName, lastName: paternalName }),
    clinic,
    primaryRole: faker.helpers.arrayElement([
      "ADMIN",
      "MEDICO",
      "RECEPCION",
      "FARMACIA",
    ]),
    isActive: faker.datatype.boolean(),
    ...overrides,
  };
};

export const createMockUserDetail = (
  overrides: Partial<UserDetail> = {},
): UserDetail => {
  const baseUser = createMockUser(overrides);
  const firstName = faker.person.firstName();
  const paternalName = faker.person.lastName();
  const maternalName = faker.person.lastName();

  return {
    ...baseUser,
    firstName,
    paternalName,
    maternalName,
    termsAccepted: true,
    mustChangePassword: false,
    lastLoginAt: faker.date.recent().toISOString(),
    lastIp: faker.internet.ipv4(),
    createdAt: faker.date.past().toISOString(),
    createdBy: {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.person.fullName(),
    },
    updatedAt: null,
    updatedBy: null,
    ...overrides,
  };
};

export const createMockUserRole = (
  overrides: Partial<UserRole> = {},
): UserRole => {
  return {
    id: faker.number.int({ min: 1, max: 20 }),
    name: "MEDICO",
    description: "Medico General",
    isPrimary: false,
    assignedAt: faker.date.recent().toISOString(),
    assignedBy: {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.person.fullName(),
    },
    ...overrides,
  };
};
