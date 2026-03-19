import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { VisitsListParams } from "@api/types";
import { createVisitsRealtimeAdapter } from "@/realtime/adapters/visits";
import {
  REALTIME_CONNECTION_STATUS,
  acquireRealtimeClient,
  type RealtimeConnectionStatus,
  type RealtimeWebSocketLike,
} from "@/realtime/client";
import {
  bindSubscriptionsRegistry,
  createRealtimeSubscriptionsRegistry,
} from "@/realtime/subscriptions";

interface UseVisitRealtimeBridgeOptions {
  enabled?: boolean;
  url?: string;
  resyncParams?: VisitsListParams;
  socketFactory?: (url: string) => RealtimeWebSocketLike;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  jitterRatio?: number;
  random?: () => number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  disconnectGraceMs?: number;
}

interface UseVisitRealtimeBridgeResult {
  connectionStatus: RealtimeConnectionStatus;
  lastSequence: number | null;
}

const DEFAULT_VISIT_STREAM_URL = "/ws/v1/visits/stream";

export const useVisitRealtimeBridge = (
  options: UseVisitRealtimeBridgeOptions = {},
): UseVisitRealtimeBridgeResult => {
  const {
    enabled = true,
    url = DEFAULT_VISIT_STREAM_URL,
    resyncParams,
    socketFactory,
    backoffBaseMs,
    backoffMaxMs,
    jitterRatio,
    random,
    heartbeatIntervalMs,
    heartbeatTimeoutMs,
    disconnectGraceMs,
  } = options;
  const queryClient = useQueryClient();

  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>(REALTIME_CONNECTION_STATUS.IDLE);
  const [lastSequence, setLastSequence] = useState<number | null>(null);
  const socketFactoryRef = useRef(socketFactory);
  const randomRef = useRef(random);
  const resyncParamsRef = useRef(resyncParams);
  const previousConnectionStatusRef = useRef<RealtimeConnectionStatus>(
    REALTIME_CONNECTION_STATUS.IDLE,
  );

  useEffect(() => {
    socketFactoryRef.current = socketFactory;
  }, [socketFactory]);

  useEffect(() => {
    randomRef.current = random;
  }, [random]);

  useEffect(() => {
    resyncParamsRef.current = resyncParams;
  }, [resyncParams]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const adapter = createVisitsRealtimeAdapter({
      queryClient,
      resyncParams: resyncParamsRef.current,
    });

    const lease = acquireRealtimeClient(
      {
        url,
        createSocket: socketFactoryRef.current,
        backoffBaseMs,
        backoffMaxMs,
        jitterRatio,
        random: randomRef.current,
        heartbeatIntervalMs,
        heartbeatTimeoutMs,
      },
      {
        disconnectGraceMs,
      },
    );

    const client = lease.client;
    const unbindGap = client.onGapDetected((gap) => {
      void adapter.handleGap(gap);
    });

    const registry = createRealtimeSubscriptionsRegistry([
      adapter.subscriptions,
    ]);
    const unbindSubscriptions = bindSubscriptionsRegistry(client, registry);
    const unbindState = client.onStateChange((state) => {
      const previousStatus = previousConnectionStatusRef.current;
      previousConnectionStatusRef.current = state.connectionStatus;

      setConnectionStatus(state.connectionStatus);
      setLastSequence(state.lastSequence);

      if (
        state.connectionStatus === REALTIME_CONNECTION_STATUS.CONNECTED &&
        previousStatus !== REALTIME_CONNECTION_STATUS.CONNECTED
      ) {
        void adapter.resync();
      }
    });

    client.connect();

    return () => {
      unbindState();
      unbindSubscriptions();
      unbindGap();
      lease.release();
    };
  }, [
    enabled,
    queryClient,
    url,
    backoffBaseMs,
    backoffMaxMs,
    jitterRatio,
    heartbeatIntervalMs,
    heartbeatTimeoutMs,
    disconnectGraceMs,
  ]);

  return {
    connectionStatus: enabled
      ? connectionStatus
      : REALTIME_CONNECTION_STATUS.IDLE,
    lastSequence,
  };
};

export type { UseVisitRealtimeBridgeOptions, UseVisitRealtimeBridgeResult };
