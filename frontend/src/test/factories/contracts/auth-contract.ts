import {
  AUTH_CAPABILITY_STATE_FIELDS,
  AUTH_USER_CONTRACT_FIELDS,
  type AuthCapabilityState,
} from "@api/types/auth.types";

const AUTH_TYPES_SOURCE_PATH =
  "frontend/src/infrastructure/api/types/auth.types.ts";
const AUTH_ERRORS_SOURCE_PATH =
  "frontend/src/infrastructure/api/utils/errors.ts";

export const AUTH_CONTRACT_HEADER_KEYS = {
  REQUEST_ID: "X-Request-ID",
  AUTH_REVISION: "X-Auth-Revision",
} as const;

export type AuthContractErrorShape = {
  code: string;
  message: string;
  status: number;
  requestId?: string;
};

export const AUTH_DOC_CHECKSUM = {
  sourcePaths: {
    types: AUTH_TYPES_SOURCE_PATH,
    errors: AUTH_ERRORS_SOURCE_PATH,
  },
  authUserFields: [
    "id",
    "username",
    "fullName",
    "email",
    "avatarUrl",
    "primaryRole",
    "landingRoute",
    "roles",
    "permissions",
    "effectivePermissions",
    "capabilities",
    "permissionDependenciesVersion",
    "strictCapabilityPrefixes",
    "authRevision",
    "mustChangePassword",
    "requiresOnboarding",
  ] as const,
  errorShape: ["code", "message", "status", "requestId?"] as const,
} as const;

export const EXPECTED_AUTH_DOC_SOURCE_PATHS = {
  types: AUTH_TYPES_SOURCE_PATH,
  errors: AUTH_ERRORS_SOURCE_PATH,
} as const;

export const AUTH_USER_FIELDS_FROM_TYPES = Object.values(
  AUTH_USER_CONTRACT_FIELDS,
);
export const AUTH_CAPABILITY_FIELDS_FROM_TYPES = Object.values(
  AUTH_CAPABILITY_STATE_FIELDS,
);

export const createContractCapabilitySample = (): AuthCapabilityState => ({
  [AUTH_CAPABILITY_STATE_FIELDS.GRANTED]: true,
  [AUTH_CAPABILITY_STATE_FIELDS.MISSING_ALL_OF]: [],
  [AUTH_CAPABILITY_STATE_FIELDS.MISSING_ANY_OF]: [],
});

export const createContractErrorSample = (
  overrides: Partial<AuthContractErrorShape> = {},
): AuthContractErrorShape => ({
  code: "SESSION_EXPIRED",
  message: "La sesion no es valida o ha expirado.",
  status: 401,
  requestId: "req-contract-401",
  ...overrides,
});
