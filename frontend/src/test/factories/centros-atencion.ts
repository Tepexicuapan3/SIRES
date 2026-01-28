import { faker } from "@faker-js/faker";
import type {
  CentroAtencionDetail,
  CentroAtencionListItem,
  CentroAtencionRef,
  CentroAtencionSchedule,
} from "@api/types/catalogos/centros-atencion.types";
import type { UserRef } from "@api/types/users.types";

const createMockUserRef = (overrides: Partial<UserRef> = {}): UserRef => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.person.fullName(),
  ...overrides,
});

export const createMockCentroAtencionRef = (
  overrides: Partial<CentroAtencionRef> = {},
): CentroAtencionRef => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: `CENTRO ${faker.location.street().toUpperCase()}`,
  ...overrides,
});

export const createMockCentroAtencionSchedule = (
  overrides: Partial<CentroAtencionSchedule> = {},
): CentroAtencionSchedule => ({
  morning: { startsAt: "07:00", endsAt: "14:00" },
  afternoon: { startsAt: "14:00", endsAt: "20:00" },
  night: { startsAt: "20:00", endsAt: "23:00" },
  ...overrides,
});

export const createMockCentroAtencionListItem = (
  overrides: Partial<CentroAtencionListItem> = {},
): CentroAtencionListItem => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: `CENTRO ${faker.location.street().toUpperCase()}`,
  folioCode: faker.string.alpha({ length: 3, casing: "upper" }),
  isExternal: faker.datatype.boolean(),
  isActive: faker.datatype.boolean(),
  ...overrides,
});

export const createMockCentroAtencionDetail = (
  overrides: Partial<CentroAtencionDetail> = {},
): CentroAtencionDetail => {
  const base = createMockCentroAtencionListItem(overrides);

  return {
    ...base,
    createdAt: faker.date.past().toISOString(),
    createdBy: createMockUserRef(),
    updatedAt: null,
    updatedBy: null,
    address: faker.location.streetAddress(),
    schedule: createMockCentroAtencionSchedule(),
    ...overrides,
  };
};
