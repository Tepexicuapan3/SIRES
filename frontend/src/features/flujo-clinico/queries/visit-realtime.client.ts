import {
  parseVisitRealtimeEnvelope,
  type VisitRealtimeEventEnvelope,
} from "@features/flujo-clinico/queries/visit-realtime.protocol";

export const SOCKET_CONNECTION_STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
} as const;

export type SocketConnectionStatus =
  (typeof SOCKET_CONNECTION_STATUS)[keyof typeof SOCKET_CONNECTION_STATUS];

export interface WebSocketLike {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close: () => void;
}

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
}

const DEFAULT_BACKOFF_BASE_MS = 1000;
const DEFAULT_BACKOFF_MAX_MS = 15000;
const DEFAULT_JITTER_RATIO = 0.1;

const createDefaultSocket = (url: string): WebSocketLike => {
  if (typeof WebSocket === "undefined") {
    throw new Error("WebSocket is not available in this environment");
  }
  return new WebSocket(url);
};

export class VisitRealtimeClient {
  private readonly url: string;
  private readonly createSocket: (url: string) => WebSocketLike;
  private readonly onEvent?: (event: VisitRealtimeEventEnvelope) => void;
  private readonly onGapDetected?: (info: GapInfo) => void;
  private readonly onResyncRequested?: () => void;
  private readonly onSocketError?: () => void;
  private readonly onSocketClosed?: (info: SocketClosedInfo) => void;
  private readonly onConnectionStatusChange?: (
    status: SocketConnectionStatus,
  ) => void;
  private readonly backoffBaseMs: number;
  private readonly backoffMaxMs: number;
  private readonly jitterRatio: number;
  private readonly random: () => number;

  private socket: WebSocketLike | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isStopped = false;
  private readonly seenEventIds = new Set<string>();

  private state: VisitRealtimeClientState = {
    connectionStatus: SOCKET_CONNECTION_STATUS.IDLE,
    lastSequence: null,
  };

  constructor(options: VisitRealtimeClientOptions) {
    this.url = options.url;
    this.createSocket = options.createSocket ?? createDefaultSocket;
    this.onEvent = options.onEvent;
    this.onGapDetected = options.onGapDetected;
    this.onResyncRequested = options.onResyncRequested;
    this.onSocketError = options.onSocketError;
    this.onSocketClosed = options.onSocketClosed;
    this.onConnectionStatusChange = options.onConnectionStatusChange;
    this.backoffBaseMs = options.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    this.backoffMaxMs = options.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
    this.jitterRatio = options.jitterRatio ?? DEFAULT_JITTER_RATIO;
    this.random = options.random ?? Math.random;
  }

  connect(): void {
    this.isStopped = false;
    this.clearReconnectTimer();
    this.openSocket(false);
  }

  private openSocket(isReconnect: boolean): void {
    if (!isReconnect) {
      this.setConnectionStatus(SOCKET_CONNECTION_STATUS.CONNECTING);
    }

    const socket = this.createSocket(this.url);
    this.socket = socket;
    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionStatus(SOCKET_CONNECTION_STATUS.CONNECTED);
    };
    socket.onmessage = (event) => {
      this.handleRawMessage(event.data);
    };
    socket.onerror = () => {
      this.setConnectionStatus(SOCKET_CONNECTION_STATUS.ERROR);
      this.onSocketError?.();
    };
    socket.onclose = (event) => {
      this.setConnectionStatus(SOCKET_CONNECTION_STATUS.DISCONNECTED);
      this.onSocketClosed?.({ code: event.code, reason: event.reason });
      if (!this.isStopped) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    this.isStopped = true;
    this.clearReconnectTimer();

    if (!this.socket) {
      this.setConnectionStatus(SOCKET_CONNECTION_STATUS.DISCONNECTED);
      return;
    }

    const socket = this.socket;
    this.socket = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
    this.setConnectionStatus(SOCKET_CONNECTION_STATUS.DISCONNECTED);
  }

  getState(): VisitRealtimeClientState {
    return { ...this.state };
  }

  private handleRawMessage(rawData: string): void {
    const event = parseVisitRealtimeEnvelope(rawData);
    if (!event) {
      return;
    }

    if (this.seenEventIds.has(event.eventId)) {
      return;
    }

    if (!this.shouldAcceptBySequence(event.sequence)) {
      return;
    }

    this.seenEventIds.add(event.eventId);
    this.state.lastSequence = event.sequence;
    this.onEvent?.(event);
  }

  private shouldAcceptBySequence(sequence: number): boolean {
    const { lastSequence } = this.state;
    if (lastSequence === null) {
      return true;
    }

    if (sequence <= lastSequence) {
      return false;
    }

    if (sequence > lastSequence + 1) {
      this.onGapDetected?.({
        expectedSequence: lastSequence + 1,
        receivedSequence: sequence,
      });
      this.onResyncRequested?.();
    }

    return true;
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const factor = 2 ** this.reconnectAttempts;
    const unclampedBackoff = this.backoffBaseMs * factor;
    const backoff = Math.min(unclampedBackoff, this.backoffMaxMs);
    const jitter = backoff * this.jitterRatio * this.random();
    const reconnectDelayMs = Math.round(backoff + jitter);

    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.openSocket(true);
    }, reconnectDelayMs);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private setConnectionStatus(status: SocketConnectionStatus): void {
    this.state.connectionStatus = status;
    this.onConnectionStatusChange?.(status);
  }
}
