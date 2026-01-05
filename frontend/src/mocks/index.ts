/**
 * Mock Users - Index
 *
 * Exporta todos los mocks de usuarios y utilidades de testing
 */

export {
  MOCK_CREDENTIALS,
  MOCK_USERS_DB,
  mockLoginResponse,
  validateMockCredentials,
  getMockUser,
  listAllMockUsers,
} from "./users.mock";

// Re-export types for convenience
export type { Usuario, LoginResponse } from "@api/types/auth.types";
