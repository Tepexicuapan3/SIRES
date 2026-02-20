import type { VisitsListParams } from "@api/types";
import {
  SOCKET_CONNECTION_STATUS,
  type SocketConnectionStatus,
  type WebSocketLike,
} from "@features/flujo-clinico/queries/visit-realtime.client";
import { useVisitRealtimeBridge } from "@features/flujo-clinico/queries/useVisitRealtimeBridge";

interface UseVisitRealtimeSyncOptions {
  enabled?: boolean;
  url?: string;
  resyncParams?: VisitsListParams;
  socketFactory?: (url: string) => WebSocketLike;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  jitterRatio?: number;
  random?: () => number;
}

interface UseVisitRealtimeSyncResult {
  connectionStatus: SocketConnectionStatus;
  lastSequence: number | null;
}

const DEFAULT_VISIT_STREAM_URL = "/ws/v1/visits/stream";

export const useVisitRealtimeSync = (
  options: UseVisitRealtimeSyncOptions = {},
): UseVisitRealtimeSyncResult => {
  const {
    enabled = true,
    url = DEFAULT_VISIT_STREAM_URL,
    resyncParams,
    socketFactory,
    backoffBaseMs,
    backoffMaxMs,
    jitterRatio,
    random,
  } = options;

  const bridge = useVisitRealtimeBridge({
    enabled,
    url,
    resyncParams,
    socketFactory,
    backoffBaseMs,
    backoffMaxMs,
    jitterRatio,
    random,
  });

  return {
    connectionStatus: enabled
      ? bridge.connectionStatus
      : SOCKET_CONNECTION_STATUS.IDLE,
    lastSequence: bridge.lastSequence,
  };
};
