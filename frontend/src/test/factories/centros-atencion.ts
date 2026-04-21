import { faker } from "@faker-js/faker";
import type {
  CentroAtencionDetail,
  CentroAtencionListItem,
  CentroAtencionRef,
  CentroAtencionHorarioListItem,
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
  name: `Centro ${faker.location.street()}`,
  ...overrides,
});

export const createMockCentroAtencionListItem = (
  overrides: Partial<CentroAtencionListItem> = {},
): CentroAtencionListItem => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: `Centro ${faker.location.street()}`,
  code: faker.string.alpha({ length: 6, casing: "upper" }),
  centerType: faker.helpers.arrayElement(["CLINICA", "HOSPITAL"] as const),
  legacyFolio: faker.string.alpha({ length: 3, casing: "upper" }),
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
    postalCode: faker.string.numeric(5),
    neighborhood: faker.location.county(),
    municipality: faker.location.city(),
    state: faker.location.state(),
    city: faker.location.city(),
    phone: faker.phone.number(),
    ...overrides,
  };
};

export const createMockCentroAtencionHorarioListItem = (
  overrides: Partial<CentroAtencionHorarioListItem> = {},
): CentroAtencionHorarioListItem => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  center: createMockCentroAtencionRef(),
  shift: { id: faker.number.int({ min: 1, max: 3 }), name: "Matutino" },
  weekDay: faker.number.int({ min: 1, max: 7 }) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
  isOpen: true,
  is24Hours: false,
  openingTime: "07:00:00",
  closingTime: "14:00:00",
  isActive: true,
  ...overrides,
});
