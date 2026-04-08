import {
  AUTH_CAPABILITY_STATE_FIELDS,
  AUTH_USER_CONTRACT_FIELDS,
  type AuthCapabilityState,
} from "@api/types/auth.types";

export const AUTH_DOC_CHECKSUM = {
  sourcePaths: {
    types: "frontend/src/infrastructure/api/types/auth.types.ts",
    errors: "frontend/src/infrastructure/api/utils/errors.ts",
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
  types: "frontend/src/infrastructure/api/types/auth.types.ts",
  errors: "frontend/src/infrastructure/api/utils/errors.ts",
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
