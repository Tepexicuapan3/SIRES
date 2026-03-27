import {
  REALTIME_CONNECTION_STATUS,
  createRealtimeClient,
  type RealtimeClient,
  type RealtimeConnectionStatus,
  type RealtimeSequenceGap,
  type RealtimeSocketClosedInfo,
  type RealtimeWebSocketLike,
} from "@realtime/core/client";
import type { VisitRealtimeEventEnvelope } from "@realtime/streams/visits/protocol";

export const SOCKET_CONNECTION_STATUS = REALTIME_CONNECTION_STATUS;

export type SocketConnectionStatus = RealtimeConnectionStatus;
export type WebSocketLike = RealtimeWebSocketLike;

interface GapInfo {
  expectedSequence: number;
  receivedSequence: number;
}

interface SocketClosedInfo {
  code: number;
  reason: string;
}

interface VisitRealtimeClientState {
  connectionStatus: SocketConnectionStatus;
  lastSequence: number | null;
}

interface VisitRealtimeClientOptions {
  url: string;
  createSocket?: (url: string) => WebSocketLike;
  onEvent?: (event: VisitRealtimeEventEnvelope) => void;
  onGapDetected?: (info: GapInfo) => void;
  onResyncRequested?: () => void;
  onSocketError?: () => void;
  onSocketClosed?: (info: SocketClosedInfo) => void;
  onConnectionStatusChange?: (status: SocketConnectionStatus) => void;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  jitterRatio?: number;
  random?: () => number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
}

export class VisitRealtimeClient {
  private readonly client: RealtimeClient;

  constructor(options: VisitRealtimeClientOptions) {
    this.client = createRealtimeClient({
      url: options.url,
      createSocket: options.createSocket,
      backoffBaseMs: options.backoffBaseMs,
      backoffMaxMs: options.backoffMaxMs,
      jitterRatio: options.jitterRatio,
      random: options.random,
      heartbeatIntervalMs: options.heartbeatIntervalMs,
      heartbeatTimeoutMs: options.heartbeatTimeoutMs,
      onGap: (gap: RealtimeSequenceGap) => {
        options.onGapDetected?.(gap);
        options.onResyncRequested?.();
      },
      onSocketError: options.onSocketError,
      onSocketClosed: (info: RealtimeSocketClosedInfo) => {
        options.onSocketClosed?.(info);
      },
    });

    if (options.onEvent) {
      this.client.subscribe("*", (event) => {
        options.onEvent?.(event);
      });
    }

    if (options.onConnectionStatusChange) {
      let lastStatus = this.client.getState().connectionStatus;
      this.client.onStateChange((state) => {
        if (state.connectionStatus === lastStatus) {
          return;
        }

        lastStatus = state.connectionStatus;
        options.onConnectionStatusChange?.(state.connectionStatus);
      });
    }
  }

  connect(): void {
    this.client.connect();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  getState(): VisitRealtimeClientState {
    const state = this.client.getState();
    return {
      connectionStatus: state.connectionStatus,
      lastSequence: state.lastSequence,
    };
  }
}
