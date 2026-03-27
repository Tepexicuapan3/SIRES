import type {
  AxiosHeaders,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
} from "axios";
import type { AuthUser } from "@api/types";
import { authKeys } from "@features/auth/queries/auth.keys";
import { queryClient } from "@app/config/query-client";

const AUTH_REVISION_HEADER = "x-auth-revision";
const INVALIDATION_COOLDOWN_MS = 10_000;

let syncInFlight = false;
let lastInvalidationRevision: string | null = null;
let lastInvalidationAt = 0;

export const resetAuthSessionSyncState = () => {
  syncInFlight = false;
  lastInvalidationRevision = null;
  lastInvalidationAt = 0;
};

type AuthRevisionHeaders =
  | AxiosHeaders
  | AxiosResponseHeaders
  | Partial<RawAxiosResponseHeaders>
  | undefined;

const readAuthRevisionHeader = (
  headers: AuthRevisionHeaders,
): string | null => {
  if (!headers) {
    return null;
  }

  if (typeof (headers as AxiosHeaders).get === "function") {
    const value = (headers as AxiosHeaders).get(AUTH_REVISION_HEADER);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const rawValue =
    (headers as Record<string, unknown>)[AUTH_REVISION_HEADER] ??
    (headers as Record<string, unknown>)["X-Auth-Revision"];

  if (typeof rawValue !== "string") {
    return null;
  }

  const normalizedValue = rawValue.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const isSessionEndpoint = (requestUrl?: string): boolean => {
  if (!requestUrl) {
    return false;
  }

  return requestUrl.includes("/auth/me");
};

const shouldSkipInvalidation = (
  revision: string,
  currentRevision: string | null | undefined,
) => {
  if (syncInFlight) {
    return true;
  }

  if (currentRevision === revision) {
    return true;
  }

  return (
    lastInvalidationRevision === revision &&
    Date.now() - lastInvalidationAt < INVALIDATION_COOLDOWN_MS
  );
};

export const syncAuthSessionRevision = ({
  headers,
  requestUrl,
}: {
  headers: AuthRevisionHeaders;
  requestUrl?: string;
}) => {
  const revision = readAuthRevisionHeader(headers);
  if (!revision || isSessionEndpoint(requestUrl)) {
    return;
  }

  const currentSession = queryClient.getQueryData<AuthUser | null>(
    authKeys.session(),
  );
  if (!currentSession) {
    return;
  }

  if (shouldSkipInvalidation(revision, currentSession.authRevision)) {
    return;
  }

  syncInFlight = true;
  lastInvalidationRevision = revision;
  lastInvalidationAt = Date.now();

  void queryClient
    .invalidateQueries({
      queryKey: authKeys.session(),
      refetchType: "active",
    })
    .finally(() => {
      syncInFlight = false;
    });
};
