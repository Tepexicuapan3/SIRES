import { describe, expect, it } from "vitest";
import { createMockAuthUser } from "@/test/factories/users";
import {
  AUTH_CAPABILITY_FIELDS_FROM_TYPES,
  AUTH_DOC_CHECKSUM,
  AUTH_USER_FIELDS_FROM_TYPES,
  EXPECTED_AUTH_DOC_SOURCE_PATHS,
  createContractCapabilitySample,
} from "@/test/factories/contracts/auth-contract";

describe("auth contract alignment", () => {
  it("mantiene alineados docs checksum, api types y mock auth user", () => {
    expect(AUTH_DOC_CHECKSUM.sourcePaths).toEqual(
      EXPECTED_AUTH_DOC_SOURCE_PATHS,
    );

    expect(AUTH_DOC_CHECKSUM.authUserFields).toEqual(
      AUTH_USER_FIELDS_FROM_TYPES,
    );

    const mockAuthUser = createMockAuthUser({
      capabilities: {
        "admin.users.read": createContractCapabilitySample(),
      },
    });

    for (const field of AUTH_DOC_CHECKSUM.authUserFields) {
      expect(mockAuthUser).toHaveProperty(field);
    }

    const [capabilityKey] = Object.keys(mockAuthUser.capabilities);
    const capabilitySample = mockAuthUser.capabilities[capabilityKey];

    for (const field of AUTH_CAPABILITY_FIELDS_FROM_TYPES) {
      expect(capabilitySample).toHaveProperty(field);
    }
  });
});
