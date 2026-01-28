import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  setAuthSession,
  clearAuthSession,
} from "@/features/auth/utils/auth-cache";
import { authKeys } from "@/features/auth/queries/auth.keys";
import { createMockAuthUser } from "@/test/factories/users";

describe("auth-cache", () => {
  it("stores the auth session in query cache", () => {
    const queryClient = new QueryClient();
    const user = createMockAuthUser();

    setAuthSession(queryClient, user);

    const cachedUser = queryClient.getQueryData(authKeys.session());
    expect(cachedUser).toEqual(user);
  });

  it("clears the auth session from query cache", () => {
    const queryClient = new QueryClient();
    const user = createMockAuthUser();

    setAuthSession(queryClient, user);
    clearAuthSession(queryClient);

    const cachedUser = queryClient.getQueryData(authKeys.session());
    expect(cachedUser).toBeUndefined();
  });
});
