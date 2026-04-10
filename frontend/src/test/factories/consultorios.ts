import { faker } from "@faker-js/faker";
import type {
  ConsultorioCatalogRef,
  ConsultorioDetail,
  ConsultorioListItem,
} from "@api/types/catalogos/consultorios.types";
import type { UserRef } from "@api/types/users.types";

const createMockUserRef = (overrides: Partial<UserRef> = {}): UserRef => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.person.fullName(),
  ...overrides,
});

const createMockCatalogRef = (
  overrides: Partial<ConsultorioCatalogRef> = {},
): ConsultorioCatalogRef => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: `Catalogo ${faker.commerce.department()}`,
  ...overrides,
});

export const createMockConsultorioListItem = (
  overrides: Partial<ConsultorioListItem> = {},
): ConsultorioListItem => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: `Consultorio ${faker.number.int({ min: 1, max: 40 })}`,
  code: faker.number.int({ min: 1, max: 9999 }),
  isActive: faker.datatype.boolean(),
  ...overrides,
});

export const createMockConsultorioDetail = (
  overrides: Partial<ConsultorioDetail> = {},
): ConsultorioDetail => {
  const base = createMockConsultorioListItem(overrides);

  return {
    ...base,
    createdAt: faker.date.past().toISOString(),
    createdBy: createMockUserRef(),
    updatedAt: null,
    updatedBy: null,
    turn: createMockCatalogRef({ name: "Matutino" }),
    center: createMockCatalogRef({ name: "Centro Norte" }),
    ...overrides,
  };
};
