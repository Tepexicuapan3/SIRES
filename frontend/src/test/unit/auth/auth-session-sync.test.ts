import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authKeys } from "@/domains/auth-access/state/auth.keys";
import {
  resetAuthSessionSyncState,
  syncAuthSessionRevision,
} from "@/domains/auth-access/adapters/auth-session-sync";
import { queryClient } from "@app/config/query-client";
import { createMockAuthUser } from "@/test/factories/users";

describe("auth-session-sync", () => {
  beforeEach(() => {
    vi.useRealTimers();
    queryClient.clear();
    resetAuthSessionSyncState();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    queryClient.clear();
    resetAuthSessionSyncState();
  });

  it("invalidates auth session when revision header differs", () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    queryClient.setQueryData(
      authKeys.session(),
      createMockAuthUser({ authRevision: "2026-02-23T16:00:00Z" }),
    );

    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:01:00Z" },
      requestUrl: "/users/10/roles",
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: authKeys.session(),
      refetchType: "active",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: authKeys.capabilities(),
      refetchType: "active",
    });
  });

  it("skips invalidation when revision is unchanged", () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    queryClient.setQueryData(
      authKeys.session(),
      createMockAuthUser({ authRevision: "2026-02-23T16:00:00Z" }),
    );

    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:00:00Z" },
      requestUrl: "/roles/5",
    });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("ignores auth/me responses to avoid self-invalidating loops", () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    queryClient.setQueryData(
      authKeys.session(),
      createMockAuthUser({ authRevision: "2026-02-23T16:00:00Z" }),
    );

    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:02:00Z" },
      requestUrl: "/auth/me",
    });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("invalidates when current session has no authRevision yet", () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    queryClient.setQueryData(
      authKeys.session(),
      createMockAuthUser({ authRevision: "" }),
    );

    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:03:00Z" },
      requestUrl: "/roles/permissions/assign",
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: authKeys.session(),
      refetchType: "active",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: authKeys.capabilities(),
      refetchType: "active",
    });
  });

  it("forces exactly one recompute gate when X-Auth-Revision changes and session cache is still stale", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T16:00:00.000Z"));

    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);

    queryClient.setQueryData(
      authKeys.session(),
      createMockAuthUser({ authRevision: "2026-02-23T16:00:00Z" }),
    );

    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:01:00Z" },
      requestUrl: "/roles/permissions/assign",
    });

    vi.setSystemTime(new Date("2026-02-23T16:00:15.000Z"));
    syncAuthSessionRevision({
      headers: { "x-auth-revision": "2026-02-23T16:01:00Z" },
      requestUrl: "/users/10/roles",
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(1, {
      queryKey: authKeys.session(),
      refetchType: "active",
    });
    expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(2, {
      queryKey: authKeys.capabilities(),
      refetchType: "active",
    });
  });
});
