import { faker } from "@faker-js/faker";
import type {
  AreaDetail,
  AreaListItem,
} from "@api/types/catalogos/areas.types";
import type { UserRef } from "@api/types/users.types";

const createMockUserRef = (overrides: Partial<UserRef> = {}): UserRef => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.person.fullName(),
  ...overrides,
});

export const createMockAreaListItem = (
  overrides: Partial<AreaListItem> = {},
): AreaListItem => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: `Area ${faker.commerce.department()}`,
  code: faker.string.alpha({ length: 4, casing: "upper" }),
  isActive: faker.datatype.boolean(),
  ...overrides,
});

export const createMockAreaDetail = (
  overrides: Partial<AreaDetail> = {},
): AreaDetail => {
  const base = createMockAreaListItem(overrides);

  return {
    ...base,
    createdAt: faker.date.past().toISOString(),
    createdBy: createMockUserRef(),
    updatedAt: null,
    updatedBy: null,
    ...overrides,
  };
};
