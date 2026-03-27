import { env } from "@app/config/env";
import type { VisitsListParams } from "@api/types";
import {
  SOCKET_CONNECTION_STATUS,
  type SocketConnectionStatus,
  type WebSocketLike,
} from "@realtime/streams/visits/client";
import { useVisitRealtimeBridge } from "@realtime/streams/visits/useVisitRealtimeBridge";

interface UseVisitRealtimeSyncOptions {
  enabled?: boolean;
  url?: string;
  resyncParams?: VisitsListParams;
  socketFactory?: (url: string) => WebSocketLike;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  jitterRatio?: number;
  random?: () => number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  disconnectGraceMs?: number;
}

interface UseVisitRealtimeSyncResult {
  connectionStatus: SocketConnectionStatus;
  lastSequence: number | null;
}

const DEFAULT_VISIT_STREAM_PATH = "/ws/v1/visits/stream";
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 10_000;
const DEFAULT_DEV_BACKEND_PORT = 5000;
const DEFAULT_BACKOFF_BASE_MS = 1_000;
const DEFAULT_BACKOFF_MAX_MS = 30_000;
const DEFAULT_JITTER_RATIO = 0.1;
const DEFAULT_DISCONNECT_GRACE_MS = 1_500;

const parsePositiveNumber = (value: string | undefined): number | null => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseNonNegativeNumber = (value: string | undefined): number | null => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const parsePortNumber = (value: string | undefined): number | null => {
  const parsed = parsePositiveNumber(value);
  if (parsed === null) {
    return null;
  }

  const normalizedPort = Math.trunc(parsed);
  if (normalizedPort < 1 || normalizedPort > 65_535) {
    return null;
  }

  return normalizedPort;
};

const resolveVisitStreamPath = (): string => {
  const configuredPath = import.meta.env.VITE_VISITS_STREAM_PATH;
  if (typeof configuredPath === "string" && configuredPath.trim().length > 0) {
    return configuredPath;
  }

  return DEFAULT_VISIT_STREAM_PATH;
};

const buildWsUrlFromPath = (path: string): string => {
  return buildWsUrlFromHost(path, window.location.host);
};

const buildWsUrlFromHost = (path: string, host: string): string => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${protocol}://${host}${normalizedPath}`;
};

const resolveDevBackendPort = (): number => {
  return (
    parsePortNumber(import.meta.env.VITE_BACKEND_PORT) ??
    DEFAULT_DEV_BACKEND_PORT
  );
};

const normalizeWebSocketUrl = (rawUrl: string): string => {
  const trimmedUrl = rawUrl.trim();

  if (/^wss?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    const parsedUrl = new URL(trimmedUrl);
    parsedUrl.protocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
    return parsedUrl.toString();
  }

  if (/^\/\//.test(trimmedUrl)) {
    const protocol =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "wss"
        : "ws";
    return `${protocol}:${trimmedUrl}`;
  }

  if (typeof window !== "undefined") {
    return buildWsUrlFromPath(trimmedUrl);
  }

  return trimmedUrl;
};

const resolveWsUrlFromApiUrl = (): string | null => {
  const apiUrl = env.apiUrl;
  if (!/^https?:\/\//i.test(apiUrl)) {
    if (
      import.meta.env.DEV &&
      typeof window !== "undefined" &&
      apiUrl.startsWith("/")
    ) {
      const hostName = window.location.hostname.trim();
      if (hostName.length === 0) {
        return null;
      }

      const normalizedHostName = hostName.includes(":")
        ? `[${hostName}]`
        : hostName;
      const backendHost = `${normalizedHostName}:${resolveDevBackendPort()}`;
      return buildWsUrlFromHost(resolveVisitStreamPath(), backendHost);
    }

    return null;
  }

  const parsedUrl = new URL(apiUrl);
  const protocol = parsedUrl.protocol === "https:" ? "wss" : "ws";

  if (import.meta.env.DEV && typeof window !== "undefined") {
    const runtimeHostName = window.location.hostname.trim();
    const configuredHostName = parsedUrl.hostname.trim().toLowerCase();
    const shouldUseRuntimeHost =
      runtimeHostName.length > 0 &&
      ["backend", "localhost", "127.0.0.1", "0.0.0.0"].includes(
        configuredHostName,
      ) &&
      runtimeHostName.toLowerCase() !== configuredHostName;

    if (shouldUseRuntimeHost) {
      const normalizedRuntimeHost = runtimeHostName.includes(":")
        ? `[${runtimeHostName}]`
        : runtimeHostName;
      const runtimeHostWithPort = parsedUrl.port
        ? `${normalizedRuntimeHost}:${parsedUrl.port}`
        : normalizedRuntimeHost;

      return `${protocol}://${runtimeHostWithPort}${resolveVisitStreamPath()}`;
    }
  }

  return `${protocol}://${parsedUrl.host}${resolveVisitStreamPath()}`;
};

const resolveDefaultVisitStreamUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_VISITS_STREAM_URL;
  if (typeof configuredUrl === "string" && configuredUrl.trim().length > 0) {
    return normalizeWebSocketUrl(configuredUrl);
  }

  const wsUrlFromApi = resolveWsUrlFromApiUrl();
  if (wsUrlFromApi) {
    return wsUrlFromApi;
  }

  if (typeof window !== "undefined") {
    return buildWsUrlFromPath(resolveVisitStreamPath());
  }

  return resolveVisitStreamPath();
};

const resolveHeartbeatIntervalMs = (): number => {
  return (
    parsePositiveNumber(
      import.meta.env.VITE_VISITS_STREAM_HEARTBEAT_INTERVAL_MS,
    ) ?? DEFAULT_HEARTBEAT_INTERVAL_MS
  );
};

const resolveHeartbeatTimeoutMs = (): number => {
  return (
    parsePositiveNumber(
      import.meta.env.VITE_VISITS_STREAM_HEARTBEAT_TIMEOUT_MS,
    ) ?? DEFAULT_HEARTBEAT_TIMEOUT_MS
  );
};

const resolveBackoffBaseMs = (): number => {
  return (
    parsePositiveNumber(import.meta.env.VITE_VISITS_STREAM_BACKOFF_BASE_MS) ??
    DEFAULT_BACKOFF_BASE_MS
  );
};

const resolveBackoffMaxMs = (): number => {
  return (
    parsePositiveNumber(import.meta.env.VITE_VISITS_STREAM_BACKOFF_MAX_MS) ??
    DEFAULT_BACKOFF_MAX_MS
  );
};

const resolveJitterRatio = (): number => {
  const configuredJitter = parseNonNegativeNumber(
    import.meta.env.VITE_VISITS_STREAM_JITTER_RATIO,
  );
  if (configuredJitter === null) {
    return DEFAULT_JITTER_RATIO;
  }

  return Math.min(configuredJitter, 1);
};

const resolveDisconnectGraceMs = (): number => {
  return (
    parseNonNegativeNumber(
      import.meta.env.VITE_VISITS_STREAM_DISCONNECT_GRACE_MS,
    ) ?? DEFAULT_DISCONNECT_GRACE_MS
  );
};

export const useVisitRealtimeSync = (
  options: UseVisitRealtimeSyncOptions = {},
): UseVisitRealtimeSyncResult => {
  const {
    enabled = true,
    url = resolveDefaultVisitStreamUrl(),
    resyncParams,
    socketFactory,
    backoffBaseMs = resolveBackoffBaseMs(),
    backoffMaxMs = resolveBackoffMaxMs(),
    jitterRatio = resolveJitterRatio(),
    random,
    heartbeatIntervalMs = resolveHeartbeatIntervalMs(),
    heartbeatTimeoutMs = resolveHeartbeatTimeoutMs(),
    disconnectGraceMs = resolveDisconnectGraceMs(),
  } = options;

  const normalizedBackoffMaxMs = Math.max(backoffMaxMs, backoffBaseMs);

  const bridge = useVisitRealtimeBridge({
    enabled,
    url,
    resyncParams,
    socketFactory,
    backoffBaseMs,
    backoffMaxMs: normalizedBackoffMaxMs,
    jitterRatio,
    random,
    heartbeatIntervalMs,
    heartbeatTimeoutMs,
    disconnectGraceMs,
  });

  return {
    connectionStatus: enabled
      ? bridge.connectionStatus
      : SOCKET_CONNECTION_STATUS.IDLE,
    lastSequence: bridge.lastSequence,
  };
};
