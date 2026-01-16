import { faker } from "@faker-js/faker";
import type { Clinica } from "@/api/types/users.types";

/**
 * Genera una clínica mock para el catálogo
 */
export const createMockClinica = (overrides: Partial<Clinica> = {}): Clinica => {
  return {
    id_clin: faker.number.int({ min: 1, max: 100 }),
    clinica: `CLÍNICA ${faker.location.street().toUpperCase()}`,
    folio_clin: faker.string.alpha({ length: 3, casing: 'upper' }),
    ...overrides,
  };
};
