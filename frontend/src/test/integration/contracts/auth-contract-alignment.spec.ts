import { describe, expect, it, vi } from "vitest";
import { createMockAuthUser } from "@/test/factories/users";
import { authAPI } from "@api/resources/auth.api";
import { queryClient } from "@app/config/query-client";
import { authKeys } from "@/domains/auth-access/state/auth.keys";
import {
  resetAuthSessionSyncState,
  syncAuthSessionRevision,
} from "@/domains/auth-access/adapters/auth-session-sync";
import {
  AUTH_CAPABILITY_FIELDS_FROM_TYPES,
  AUTH_CONTRACT_HEADER_KEYS,
  AUTH_DOC_CHECKSUM,
  AUTH_USER_FIELDS_FROM_TYPES,
  EXPECTED_AUTH_DOC_SOURCE_PATHS,
  createContractCapabilitySample,
} from "@/test/factories/contracts/auth-contract";
import { expectNormalizedAuthApiError } from "./auth-contract-assertions";

describe("auth contract alignment", () => {
  it("X-Auth-Revision change forces session/capabilities recompute before protected gating can continue", () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    queryClient.setQueryData(
      authKeys.session(),
      createMockAuthUser({ authRevision: "2026-02-23T16:00:00Z" }),
    );

    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:01:00Z" },
      requestUrl: "/roles/5",
    });

    expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(1, {
      queryKey: authKeys.session(),
      refetchType: "active",
    });
    expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(2, {
      queryKey: authKeys.capabilities(),
      refetchType: "active",
    });

    invalidateQueriesSpy.mockRestore();
    queryClient.clear();
    resetAuthSessionSyncState();
  });

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

  it("normalizes auth errors with code/message/status/requestId for invalid credentials", async () => {
    try {
      await authAPI.login({ username: "error", password: "password123" });
      throw new Error("Expected authAPI.login to fail for invalid credentials");
    } catch (error) {
      expectNormalizedAuthApiError(error, {
        code: "INVALID_CREDENTIALS",
        status: 401,
        requestId: "defined",
      });
    }
  });

  it("keeps auth revision aligned between /auth/me and /auth/capabilities payload", async () => {
    const loginResponse = await authAPI.login({
      username: "admin",
      password: "password123",
    });

    const sessionResponse = await authAPI.getCurrentUser();
    const capabilitiesResponse = await authAPI.getCapabilities();

    expect(loginResponse.user.authRevision).toBeTruthy();
    expect(sessionResponse.authRevision).toBe(loginResponse.user.authRevision);
    expect(capabilitiesResponse.authRevision).toBe(
      sessionResponse.authRevision,
    );

    expect(AUTH_CONTRACT_HEADER_KEYS.AUTH_REVISION).toBe("X-Auth-Revision");
  });
});
