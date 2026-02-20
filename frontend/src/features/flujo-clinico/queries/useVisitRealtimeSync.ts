import { useEffect, useRef, useState } from "react";
import { visitsAPI } from "@api/resources/visits.api";
import type { VisitsListParams } from "@api/types";
import {
  SOCKET_CONNECTION_STATUS,
  VisitRealtimeClient,
  type SocketConnectionStatus,
  type WebSocketLike,
} from "@features/flujo-clinico/queries/visit-realtime.client";

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

  const [connectionStatus, setConnectionStatus] =
    useState<SocketConnectionStatus>(SOCKET_CONNECTION_STATUS.IDLE);
  const [lastSequence, setLastSequence] = useState<number | null>(null);
  const clientRef = useRef<VisitRealtimeClient | null>(null);
  const socketFactoryRef = useRef(socketFactory);
  const resyncParamsRef = useRef(resyncParams);
  const randomRef = useRef(random);

  useEffect(() => {
    socketFactoryRef.current = socketFactory;
  }, [socketFactory]);

  useEffect(() => {
    resyncParamsRef.current = resyncParams;
  }, [resyncParams]);

  useEffect(() => {
    randomRef.current = random;
  }, [random]);

  useEffect(() => {
    if (!enabled) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      return;
    }

    const client = new VisitRealtimeClient({
      url,
      createSocket: socketFactoryRef.current,
      onConnectionStatusChange: setConnectionStatus,
      onEvent: (event) => {
        setLastSequence(event.sequence);
      },
      onResyncRequested: () => {
        void visitsAPI.getAll(resyncParamsRef.current);
      },
      backoffBaseMs,
      backoffMaxMs,
      jitterRatio,
      random: randomRef.current,
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [enabled, url, backoffBaseMs, backoffMaxMs, jitterRatio]);

  return {
    connectionStatus: enabled
      ? connectionStatus
      : SOCKET_CONNECTION_STATUS.IDLE,
    lastSequence,
  };
};
